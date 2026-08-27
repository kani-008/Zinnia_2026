"""
Zinnia 2026 — Admin Routes Blueprint
Defines API endpoints for Admin Panel management & verification.
"""

from flask import Blueprint
from controllers.admin_controller import AdminController

admin_bp = Blueprint("admin_bp", __name__)

admin_bp.route("/api/admin/stats", methods=["GET"])(AdminController.get_dashboard_stats)
admin_bp.route("/api/admin/participants", methods=["GET"])(AdminController.get_participants)
admin_bp.route("/api/admin/verify-qr", methods=["POST"])(AdminController.verify_qr)
admin_bp.route("/api/admin/checkin", methods=["POST"])(AdminController.checkin_participant)
admin_bp.route("/api/admin/checkins", methods=["GET"])(AdminController.get_checkin_history)
