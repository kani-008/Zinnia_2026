"""
Zinnia 2026 — Payment & Verification Routes
Defines endpoints for participant payment submission and admin verification/rejection.
"""

from flask import Blueprint
from controllers.payment_controller import PaymentController

payment_bp = Blueprint("payment_bp", __name__)

# Participant Payment Endpoints
payment_bp.route("/api/payment/status", methods=["GET"])(PaymentController.get_status)
payment_bp.route("/api/payment/submit", methods=["POST"])(PaymentController.submit_payment)

# Admin Payment Operations
payment_bp.route("/api/admin/payment/verify", methods=["POST"])(PaymentController.verify_payment)
payment_bp.route("/api/admin/payment/reject", methods=["POST"])(PaymentController.reject_payment)
payment_bp.route("/api/admin/payments/list", methods=["GET"])(PaymentController.list_payments)
