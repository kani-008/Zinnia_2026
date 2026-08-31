"""
Zinnia 2026 — Admin Routes Blueprint
Consolidates all administrative, coordinator, payment verification, and check-in endpoints.
"""

from flask import Blueprint
from controllers.admin_controller import AdminController
from middleware.auth_middleware import require_auth, require_role

admin_bp = Blueprint("admin_bp", __name__)

# Authentication
admin_bp.add_url_rule("/api/admin/auth/login", endpoint="admin_auth_login", view_func=AdminController.login, methods=["POST"])
admin_bp.add_url_rule("/api/admin/login", endpoint="admin_login", view_func=AdminController.login, methods=["POST"])

# Telemetry & Dashboard Stats (Authenticated)
admin_bp.add_url_rule("/api/admin/stats", endpoint="admin_stats", view_func=require_auth(AdminController.get_stats), methods=["GET"])

# Admin Check-in Operations (Under /api/admin/checkin/*)
admin_bp.add_url_rule("/api/admin/checkin/entry", endpoint="admin_checkin_entry", view_func=AdminController.checkin_entry, methods=["POST"])
admin_bp.add_url_rule("/api/admin/checkin/event", endpoint="admin_checkin_event", view_func=AdminController.checkin_event, methods=["POST"])
admin_bp.add_url_rule("/api/admin/checkin/food", endpoint="admin_checkin_food", view_func=AdminController.checkin_food, methods=["POST"])

# Payment Verification Operations (Treasurer & Super Admin)
admin_bp.add_url_rule("/api/admin/payments", endpoint="admin_payments", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.get_payments), methods=["GET"])
admin_bp.add_url_rule("/api/admin/payments/list", endpoint="admin_payments_list", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.get_payments), methods=["GET"])
admin_bp.add_url_rule("/api/admin/payments/verify", endpoint="admin_payments_verify", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.verify_payment_endpoint), methods=["POST"])
admin_bp.add_url_rule("/api/admin/payment/verify", endpoint="admin_payment_verify_singular", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.verify_payment_endpoint), methods=["POST"])
admin_bp.add_url_rule("/api/admin/payments/reject", endpoint="admin_payments_reject", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.reject_payment_endpoint), methods=["POST"])
admin_bp.add_url_rule("/api/admin/payment/reject", endpoint="admin_payment_reject_singular", view_func=require_role("TREASURER", "SUPER_ADMIN")(AdminController.reject_payment_endpoint), methods=["POST"])
