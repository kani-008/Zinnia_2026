"""
Zinnia 2026 — Payment Controller
Handles UPI payment submissions and status inquiries.
"""

from flask import request, jsonify
from services.payment_service import (
    submit_payment_service,
    get_payment_status_service
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
