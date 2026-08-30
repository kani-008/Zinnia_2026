"""
Zinnia 2026 — Payment Routes
Defines endpoints for participant payment submission and status lookup.
"""

from flask import Blueprint
from controllers.payment_controller import PaymentController

payment_bp = Blueprint("payment_bp", __name__)

# Participant Payment Endpoints
payment_bp.route("/api/payment/status", methods=["GET"])(PaymentController.get_status)
payment_bp.route("/api/payment/submit", methods=["POST"])(PaymentController.submit_payment)
