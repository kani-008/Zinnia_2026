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
        headers = get_headers()
        try:
            r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?select=*,teams(*)", headers=headers, timeout=6)
            payments = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
            return jsonify({"success": True, "payments": payments}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e), "payments": []}), 500

    @staticmethod
    def verify_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        admin_user = getattr(g, "admin", None)
        admin_name = admin_user.get("name") if admin_user else (data.get("admin_name") or "Treasurer")

        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id parameter."}), 400

        headers = get_headers()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 1. Update team_payments table
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}",
            headers=headers,
            json={
                "payment_status": "VERIFIED",
                "verified_at": now_iso,
                "verified_by": admin_name
            }
        )

        # 2. Update teams table
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}",
            headers=headers,
            json={
                "payment_status": "VERIFIED"
            }
        )

        # 3. Idempotently trigger passport email dispatch with QR
        dispatch_res = trigger_passport_dispatch(team_id)

        return jsonify({
            "success": True,
            "message": f"Payment verified for team '{team_id}'. Official passes dispatched.",
            "team_id": team_id,
            "payment_status": "VERIFIED",
            "dispatch": dispatch_res
        }), 200

    @staticmethod
    def reject_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        reason = data.get("reason") or data.get("rejection_reason") or "Payment verification rejected by treasurer."

        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id parameter."}), 400

        headers = get_headers()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        requests.patch(
            f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}",
            headers=headers,
            json={
                "payment_status": "REJECTED",
                "rejection_reason": reason,
                "updated_at": now_iso
            }
        )

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
