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
