"""
Zinnia 2026 — Admin Routes Blueprint

Two generations of endpoint live here.

  * Check-in and the legacy stats endpoint still serve the public-schema flow
    parked at /register-legacy.
  * Everything under "ADMIN PANEL" reads the LIVE participant model in zin26
    (migration 009). The payment routes point at the new controller: the old
    ones drove promote_pending_team(), which creates member rows, and under
    the participant model that row already exists.

require_role already lets SUPER_ADMIN through everything, so it is never
listed in a decorator.
"""

from flask import Blueprint

from controllers.admin_controller import AdminController
from controllers.admin_panel_controller import AdminPanelController
from middleware.auth_middleware import require_auth, require_role
from middleware.rate_limiter import rate_limit

admin_bp = Blueprint("admin_bp", __name__)

TREASURER = ("TREASURER",)
COORDINATOR = ("EVENT_COORDINATOR", "TREASURER")


def _add(rule, endpoint, view, methods=("GET",)):
    admin_bp.add_url_rule(rule, endpoint=endpoint, view_func=view, methods=list(methods))


# ==============================================================================
# AUTHENTICATION
# ==============================================================================
# Rate limited: this is the one route worth brute-forcing, and it was the only
# unauthenticated write path without a limiter on it.
_add("/api/admin/login", "admin_login", rate_limit(10)(AdminController.login), ["POST"])
_add("/api/admin/auth/login", "admin_auth_login", rate_limit(10)(AdminController.login), ["POST"])

# Revalidates a stored token on page load. Without it the frontend cannot tell
# a valid session from an expired one except by guessing at a failure.
_add("/api/admin/me", "admin_me", require_auth(AdminPanelController.me))


# ==============================================================================
# ADMIN PANEL — dashboard (F4)
# ==============================================================================
_add("/api/admin/dashboard", "admin_dashboard", require_auth(AdminPanelController.dashboard))


# ==============================================================================
# ADMIN PANEL — event capacity and closure (F2)
# ==============================================================================
_add("/api/admin/events", "admin_events", require_auth(AdminPanelController.list_events))
_add("/api/admin/events/<code>", "admin_event_patch",
     require_role(*COORDINATOR)(AdminPanelController.patch_event), ["PATCH"])
_add("/api/admin/events/<code>/close", "admin_event_close",
     require_role(*COORDINATOR)(AdminPanelController.close_event), ["POST"])
_add("/api/admin/events/<code>/open", "admin_event_open",
     require_role(*COORDINATOR)(AdminPanelController.open_event), ["POST"])
_add("/api/admin/events/<code>/roster", "admin_event_roster",
     require_role(*COORDINATOR)(AdminPanelController.event_roster))


# ==============================================================================
# ADMIN PANEL — payment verification (F1)
# ==============================================================================
_add("/api/admin/payments", "admin_payments",
     require_role(*TREASURER)(AdminPanelController.payments))
_add("/api/admin/payments/bulk-approve", "admin_payments_bulk",
     require_role(*TREASURER)(AdminPanelController.bulk_approve), ["POST"])
_add("/api/admin/payments/<user_id>", "admin_payment_detail",
     require_role(*TREASURER)(AdminPanelController.payment_detail))
_add("/api/admin/payments/<user_id>/screenshot", "admin_payment_screenshot",
     require_role(*TREASURER)(AdminPanelController.payment_screenshot))
_add("/api/admin/payments/<user_id>/approve", "admin_payment_approve",
     require_role(*TREASURER)(AdminPanelController.approve_payment), ["POST"])
_add("/api/admin/payments/<user_id>/reject", "admin_payment_reject",
     require_role(*TREASURER)(AdminPanelController.reject_payment), ["POST"])
# Re-sends the UserID, master QR and WhatsApp link to an approved participant.
# Re-approving does not do this: treasurer_review_payment returns early on an
# already-approved record without emailing.
_add("/api/admin/payments/<user_id>/resend-pass", "admin_payment_resend",
     require_role(*TREASURER)(AdminPanelController.resend_pass), ["POST"])


# ==============================================================================
# ADMIN PANEL — Excel export (F3)
# ==============================================================================
_add("/api/admin/export/preview", "admin_export_preview",
     require_auth(AdminPanelController.export_preview), ["POST"])
_add("/api/admin/export/workbook", "admin_export_workbook",
     require_auth(AdminPanelController.export_workbook), ["POST"])
_add("/api/admin/export/event/<code>", "admin_export_event",
     require_auth(AdminPanelController.export_event))


# ==============================================================================
# ADMIN PANEL — settings and audit (SUPER_ADMIN only: an empty role list plus
# the SUPER_ADMIN passthrough means nobody else satisfies it)
# ==============================================================================
_add("/api/admin/settings", "admin_settings_get",
     require_role()(AdminPanelController.get_settings))
_add("/api/admin/settings", "admin_settings_patch",
     require_role()(AdminPanelController.patch_settings), ["PATCH"])
_add("/api/admin/audit", "admin_audit",
     require_role()(AdminPanelController.audit))


# ==============================================================================
# LEGACY — public-schema flow (/register-legacy) and on-day check-in
# ==============================================================================
_add("/api/admin/stats", "admin_stats", require_auth(AdminController.get_stats))

_add("/api/admin/checkin/entry", "admin_checkin_entry",
     require_role("ENTRY_STAFF", "GATE_ADMIN")(AdminController.checkin_entry), ["POST"])
_add("/api/admin/checkin/event", "admin_checkin_event",
     require_role("EVENT_COORDINATOR", "EVENT_ADMIN")(AdminController.checkin_event), ["POST"])
_add("/api/admin/checkin/food", "admin_checkin_food",
     require_role("FOOD_STAFF", "FOOD_ADMIN")(AdminController.checkin_food), ["POST"])

# The old team-centric queue, kept reachable for the legacy flow only.
_add("/api/admin/legacy/payments", "admin_legacy_payments",
     require_role(*TREASURER)(AdminController.get_payments))
_add("/api/admin/legacy/payments/verify", "admin_legacy_verify",
     require_role(*TREASURER)(AdminController.verify_payment_endpoint), ["POST"])
_add("/api/admin/legacy/payments/reject", "admin_legacy_reject",
     require_role(*TREASURER)(AdminController.reject_payment_endpoint), ["POST"])


# The proof image itself, addressed by a short-lived signed token rather than a
# bearer header: this URL goes straight into an <img src>, which cannot carry
# one. The token names one file and expires in five minutes, so it is not a
# standing grant — see services/drive_storage.
_add("/api/admin/payment-proof", "admin_payment_proof", AdminPanelController.payment_proof)
