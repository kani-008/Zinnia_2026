"""
Zinnia 2026 — Admin Controller Layer
Handles HTTP requests & responses for Admin Dashboard, Participants, QR Verification, Check-In, and Audit History.
"""

from flask import request, jsonify
from services.admin_service import (
    get_admin_dashboard_stats,
    get_admin_participants,
    verify_qr_token_server,
    execute_server_checkin,
    get_admin_checkin_history
)

class AdminController:
    """Controller exposing admin endpoints."""

    @staticmethod
    def get_dashboard_stats():
        """GET /api/admin/stats — Retrieve telemetry dashboard counts."""
        stats = get_admin_dashboard_stats()
        return jsonify(stats), 200

    @staticmethod
    def get_participants():
        """GET /api/admin/participants — Search and filter participants list."""
        sq = request.args.get("q", "")
        ev = request.args.get("event", "")
        reg_status = request.args.get("reg_status", "")
        checkin_status = request.args.get("checkin_status", "")

        participants = get_admin_participants(
            search_query=sq,
            event_filter=ev,
            reg_status_filter=reg_status,
            checkin_status_filter=checkin_status
        )
        return jsonify({"success": True, "count": len(participants), "participants": participants}), 200

    @staticmethod
    def verify_qr():
        """POST /api/admin/verify-qr — Verify QR token server-side."""
        data = request.get_json(silent=True) or {}
        token = data.get("qr_token") or data.get("token") or data.get("id", "")
        if not token:
            return jsonify({"success": False, "status": "INVALID", "message": "Missing qr_token in request body."}), 400

        result = verify_qr_token_server(token)
        return jsonify(result), 200

    @staticmethod
    def checkin_participant():
        """POST /api/admin/checkin — Perform server-side participant check-in."""
        data = request.get_json(silent=True) or {}
        token = data.get("qr_token") or data.get("token") or data.get("id", "")
        coordinator_id = data.get("coordinator_id") or data.get("scanned_by") or "Admin_Coordinator"
        event_id = data.get("event_id", "GATE_ENTRY")
        location = data.get("location", "Main Gate")

        if not token:
            return jsonify({"success": False, "reason": "Missing qr_token in request body."}), 400

        result = execute_server_checkin(
            qr_token=token,
            coordinator_id=coordinator_id,
            event_id=event_id,
            location=location
        )
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code

    @staticmethod
    def get_checkin_history():
        """GET /api/admin/checkins — Retrieve check-in audit history."""
        logs = get_admin_checkin_history()
        return jsonify({"success": True, "count": len(logs), "history": logs}), 200
