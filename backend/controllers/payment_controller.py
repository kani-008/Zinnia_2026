"""
Zinnia 2026 — Payment Controller
Handles UPI payment submissions, status inquiries, and admin verification/rejection.
"""

from flask import request, jsonify
from services.payment_service import (
    submit_payment_service,
    verify_admin_payment_service,
    reject_admin_payment_service,
    get_payment_status_service,
    list_all_payments_service
)

class PaymentController:
    """Controller handling payment operations."""

    @staticmethod
    def get_status():
        """GET /api/payment/status?team_id=... — Fetch live payment details."""
        team_id = request.args.get("team_id") or request.args.get("id", "")
        if not team_id:
            return jsonify({"success": False, "error_code": "TEAM_NOT_FOUND", "message": "Missing team_id parameter."}), 400

        result = get_payment_status_service(team_id)
        return jsonify(result), 200

    @staticmethod
    def submit_payment():
        """
        POST /api/payment/submit
        Accepts: { "team_id": "...", "utr_number": "...", "submitted_amount": 500 }
        """
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        utr_number = data.get("utr_number")
        
        try:
            submitted_amount = float(data.get("submitted_amount", 0))
        except (ValueError, TypeError):
            return jsonify({"success": False, "error_code": "INVALID_AMOUNT", "message": "Invalid submitted amount."}), 400

        result = submit_payment_service(
            team_id=team_id,
            utr_number=utr_number,
            submitted_amount=submitted_amount
        )
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code

    @staticmethod
    def verify_payment():
        """
        POST /api/admin/payment/verify
        Accepts: { "team_id": "...", "admin_id": "..." }
        """
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        admin_id = data.get("admin_id", "admin_lead")

        if not team_id:
            return jsonify({"success": False, "error_code": "TEAM_NOT_FOUND", "message": "Missing team_id."}), 400

        result = verify_admin_payment_service(team_id=team_id, admin_id=admin_id)
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code

    @staticmethod
    def reject_payment():
        """
        POST /api/admin/payment/reject
        Accepts: { "team_id": "...", "admin_id": "...", "rejection_reason": "..." }
        """
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        admin_id = data.get("admin_id", "admin_lead")
        rejection_reason = data.get("rejection_reason", "Payment verification failed.")

        if not team_id:
            return jsonify({"success": False, "error_code": "TEAM_NOT_FOUND", "message": "Missing team_id."}), 400

        result = reject_admin_payment_service(
            team_id=team_id,
            admin_id=admin_id,
            rejection_reason=rejection_reason
        )
        status_code = 200 if result.get("success") else 400
        return jsonify(result), status_code

    @staticmethod
    def list_payments():
        """GET /api/admin/payments/list?status=... — Admin listing with filtering."""
        status_filter = request.args.get("status")
        payments = list_all_payments_service(status_filter)
        return jsonify({"success": True, "payments": payments, "count": len(payments)})
