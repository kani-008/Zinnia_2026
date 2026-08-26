"""
Zinnia 2026 — Passport & Check-in Routes
Defines endpoints and maps them to PassportController actions.
"""

from flask import Blueprint
from controllers.passport_controller import PassportController

passport_bp = Blueprint("passport_bp", __name__)

# Passport Verification & Lookup
passport_bp.route("/api/passport/lookup", methods=["GET"])(PassportController.lookup_passport)
passport_bp.route("/api/passport/qr/<token_or_id>", methods=["GET"])(PassportController.serve_qr_image)

# Check-in Checkpoints
passport_bp.route("/api/checkin/entry", methods=["POST"])(PassportController.checkin_entry)
passport_bp.route("/api/checkin/event", methods=["POST"])(PassportController.checkin_event)
passport_bp.route("/api/checkin/food", methods=["POST"])(PassportController.checkin_food)

# Passport Dispatch Automation
passport_bp.route("/api/passport/send-email", methods=["POST"])(PassportController.send_passport_email)
passport_bp.route("/api/passport-dispatch/webhook", methods=["POST"])(PassportController.dispatch_webhook)
passport_bp.route("/api/passport-dispatch/callback", methods=["POST"])(PassportController.dispatch_callback)
passport_bp.route("/api/passport-dispatch/resend", methods=["POST"])(PassportController.dispatch_resend)

