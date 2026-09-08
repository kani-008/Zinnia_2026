"""
Zinnia 2026 — Admin Controller Layer
Handles organizer/coordinator authentication, dashboard statistics, payment approvals,
check-ins with coordinator event permission enforcement, and coordinator management.
"""

from flask import request, jsonify, g
from services.auth_service import authenticate_admin
from services.passport_service import (
    process_entry_checkin,
    process_event_checkin,
    process_food_checkin,
    trigger_passport_dispatch,
    get_headers,
    SUPABASE_URL
)
import requests
import datetime

class AdminController:
    @staticmethod
    def login():
        data = request.get_json(silent=True) or {}
        username_or_email = data.get("username") or data.get("email") or ""
        password = data.get("password", "")
        res = authenticate_admin(username_or_email, password)
        status_code = 200 if res.get("success") else 401
        return jsonify(res), status_code

    @staticmethod
    def get_stats():
        headers = get_headers()
        try:
            teams_r = requests.get(f"{SUPABASE_URL}/rest/v1/teams?select=*", headers=headers, timeout=5)
            members_r = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?select=*", headers=headers, timeout=5)
            attendance_r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance?select=*", headers=headers, timeout=5)
            payments_r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?select=*", headers=headers, timeout=5)

            teams = teams_r.json() if teams_r.status_code == 200 and isinstance(teams_r.json(), list) else []
            members = members_r.json() if members_r.status_code == 200 and isinstance(members_r.json(), list) else []
            attendance = attendance_r.json() if attendance_r.status_code == 200 and isinstance(attendance_r.json(), list) else []
            payments = payments_r.json() if payments_r.status_code == 200 and isinstance(payments_r.json(), list) else []

            entry_scans = [a for a in attendance if a.get("checkin_type") == "ENTRY"]
            food_scans = [m for m in members if m.get("food_collected")]
            verified_payments = [p for p in payments if p.get("payment_status") == "VERIFIED"]
            total_revenue = sum(float(p.get("submitted_amount") or p.get("expected_amount") or 0) for p in verified_payments)

            stats = {
                "total_teams": len(teams),
                "total_participants": len(members),
                "entry_checked_in": len(entry_scans),
                "food_claimed": len(food_scans),
                "pending_payments": len([p for p in payments if p.get("payment_status") == "PENDING_VERIFICATION"]),
                "verified_payments": len(verified_payments),
                "total_revenue": total_revenue
            }
            return jsonify({"success": True, "stats": stats}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @staticmethod
    def get_payments():
        status_filter = request.args.get("status", "").upper()

        # Participant model (zin26). ?model=participant&status=PENDING|APPROVED|REJECTED
        if request.args.get("model", "").lower() == "participant":
            from services import zin26_db as zdb
            q = "select=id,user_id,amount,txn_ref,status,reject_reason,screenshot_url,approved_at,approved_by,created_at&order=created_at.desc"
            if status_filter in ("PENDING", "APPROVED", "REJECTED"):
                q += f"&status=eq.{status_filter}"
            rows = [r for r in zdb.select("payments", q) if r.get("txn_ref")]
            ids = list({r["user_id"] for r in rows})
            people = {}
            if ids:
                people = {p["user_id"]: p for p in zdb.select(
                    "participants", f"select=user_id,name,email,phone,college,master_qr_token,payment_status&user_id=in.({','.join(ids)})")}
            from services import proof_reference

            out = []
            for r in rows:
                p = people.get(r["user_id"], {})
                # sign_file_url alone returned None for every Drive-stored
                # proof, which read as "no proof" rather than "wrong resolver".
                proof = proof_reference.resolve(r.get("screenshot_url") or "")
                out.append({
                    **r,
                    "name": p.get("name"), "email": p.get("email"), "phone": p.get("phone"),
                    "college": p.get("college"), "registration_id": p.get("master_qr_token"),
                    "screenshot_signed_url": proof.get("url") if proof.get("success") else None,
                })
            return jsonify({"success": True, "model": "participant", "payments": out}), 200
        from services.payment_service import get_pending_payments_service
        pending_data = get_pending_payments_service()
        pending_list = pending_data.get("payments", [])

        # If only unverified/pending requested
        if status_filter in ("PENDING_VERIFICATION", "AWAITING_PAYMENT", "REJECTED"):
            filtered = [p for p in pending_list if p.get("payment_status") == status_filter]
            return jsonify({"success": True, "payments": filtered}), 200

        # Fetch verified teams from main table
        headers = get_headers()
        try:
            r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?payment_status=eq.VERIFIED&select=*,teams(*)", headers=headers, timeout=6)
            verified_list = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
        except Exception:
            verified_list = []

        if status_filter == "VERIFIED":
            return jsonify({"success": True, "payments": verified_list}), 200

        # Unified list (Pending from staging + Verified from main)
        combined = pending_list + verified_list
        return jsonify({"success": True, "payments": combined}), 200

    @staticmethod
    def verify_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        admin_user = getattr(g, "admin", None)
        admin_name = admin_user.get("name") if admin_user else (data.get("admin_name") or "Treasurer")

        # Participant model (zin26): keyed by user_id / registration_id / payment_id.
        if data.get("user_id") or data.get("registration_id") or data.get("payment_id"):
            from services.participant_service import treasurer_review_payment
            res = treasurer_review_payment(
                user_id=str(data.get("user_id", "")),
                registration_id=str(data.get("registration_id", "")),
                payment_id=str(data.get("payment_id", "")),
                action="APPROVE",
                admin_name=admin_name,
                admin_id=str((admin_user or {}).get("id") or (admin_user or {}).get("admin_id") or (admin_user or {}).get("sub") or ""),
            )
            return jsonify(res), (200 if res.get("success") else 400)

        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id parameter."}), 400

        from services.payment_service import verify_payment_by_treasurer
        res = verify_payment_by_treasurer(team_id=team_id, action="VERIFY", admin_name=admin_name)
        status_code = 200 if res.get("success") else 400
        return jsonify(res), status_code

    @staticmethod
    def reject_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        reason = data.get("reason") or data.get("rejection_reason") or "Payment verification rejected by treasurer."
        admin_user = getattr(g, "admin", None)
        admin_name = admin_user.get("name") if admin_user else (data.get("admin_name") or "Treasurer")

        if data.get("user_id") or data.get("registration_id") or data.get("payment_id"):
            from services.participant_service import treasurer_review_payment
            res = treasurer_review_payment(
                user_id=str(data.get("user_id", "")),
                registration_id=str(data.get("registration_id", "")),
                payment_id=str(data.get("payment_id", "")),
                action="REJECT",
                reason=reason,
                admin_name=admin_name,
            )
            return jsonify(res), (200 if res.get("success") else 400)

        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id parameter."}), 400

        from services.payment_service import verify_payment_by_treasurer
        res = verify_payment_by_treasurer(team_id=team_id, action="REJECT", reason=reason, admin_name=admin_name)
        status_code = 200 if res.get("success") else 400
        return jsonify(res), status_code

        requests.patch(
            f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}",
            headers=headers,
            json={
                "payment_status": "REJECTED"
            }
        )

        return jsonify({"success": True, "message": f"Payment for team '{team_id}' marked as REJECTED."}), 200

    @staticmethod
    def checkin_entry():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        admin_user = getattr(g, "admin", None)
        scanned_by = admin_user.get("name") if admin_user else data.get("scanned_by", "Gate Reception Desk")
        location = data.get("location", "Main Campus Gate")

        res = process_entry_checkin(token, scanned_by, location)
        return jsonify(res), 200 if res.get("success") else 400

    @staticmethod
    def checkin_event():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        event_id = data.get("event_id", "")
        admin_user = getattr(g, "admin", None)
        scanned_by = admin_user.get("name") if admin_user else data.get("scanned_by", "Event Coordinator")
        location = data.get("location", "Event Venue")

        res = process_event_checkin(token, event_id, scanned_by, location, admin_user=admin_user)
        return jsonify(res), 200 if res.get("success") else 400

    @staticmethod
    def checkin_food():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        admin_user = getattr(g, "admin", None)
        scanned_by = admin_user.get("name") if admin_user else data.get("scanned_by", "Dining Staff")
        location = data.get("location", "Dining Counter A")

        res = process_food_checkin(token, scanned_by, location)
        return jsonify(res), 200 if res.get("success") else 400
