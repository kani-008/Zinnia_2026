"""
Zinnia 2026 — Phase 3: participant registration routes.

Runs in parallel with the legacy /api/register until Phase 6 cutover.
Public endpoints, so every one is IP rate limited.
"""

from flask import Blueprint, jsonify

from controllers.participant_auth_controller import (
    ParticipantAuthController,
    ParticipantDashboardController,
    ParticipantRegistrationVerifyController,
)
from controllers.participant_controller import ParticipantController
from controllers.participant_team_controller import ParticipantTeamController
from middleware.participant_auth import require_participant
from middleware.rate_limiter import rate_limit
from services.zin26_db import zin26_available

participant_bp = Blueprint("participant_bp", __name__)

# --- Stage 1: registration + payment (§4.1) --------------------------------
# Unauthenticated by definition — a participant has no UserID yet — so the only
participant_bp.route("/api/participant/register", methods=["POST"])(
    rate_limit(10)(ParticipantController.register)
)

participant_bp.route("/api/participant/payment/submit", methods=["POST"])(
    rate_limit(10)(ParticipantController.submit_payment)
)

# Polled by the confirmation screen while it waits, so a looser limit.
participant_bp.route("/api/participant/payment/status", methods=["GET"])(
    rate_limit(60)(ParticipantController.payment_status)
)


# --- Stage 2: login (§4.2) -------------------------------------------------
#
# request-otp is the only endpoint that sends mail on an unauthenticated call,
# so it carries the tightest limit in the file.

participant_bp.route("/api/participant/auth/request-otp", methods=["POST"])(
    rate_limit(5)(ParticipantAuthController.request_otp)
)

participant_bp.route("/api/participant/auth/verify-otp", methods=["POST"])(
    rate_limit(10)(ParticipantAuthController.verify_otp)
)

# Registration-time email check. Reuses request-otp for the code; this verify
# additionally dispatches EMAIL #1 (UserID + master QR + WhatsApp link), which
# is why it is not the same endpoint as the login verify above.
participant_bp.route("/api/participant/register/verify-email", methods=["POST"])(
    rate_limit(10)(ParticipantRegistrationVerifyController.verify_email)
)


# --- Stage 3: dashboard + individual events (§4.3) -------------------------

participant_bp.route("/api/participant/dashboard", methods=["GET"])(
    require_participant(rate_limit(60)(ParticipantDashboardController.dashboard))
)

participant_bp.route("/api/participant/events/register", methods=["POST"])(
    require_participant(rate_limit(20)(ParticipantDashboardController.register_event))
)

# The participant saying "I am done picking". The only thing that emails the
# event list, so it carries a tight limit - each press sends real mail.
participant_bp.route("/api/participant/events/confirm", methods=["POST"])(
    require_participant(rate_limit(5)(ParticipantDashboardController.confirm_lineup))
)

participant_bp.route("/api/participant/events/cancel", methods=["POST"])(
    require_participant(rate_limit(20)(ParticipantDashboardController.cancel_event))
)


# --- Phase 5: teams (§4.3) -------------------------------------------------
#
# All behind require_participant: the acting UserID comes from the session
# token and never from the body, so a captain cannot act as a teammate. The
# lookup endpoint is read-only and gets a looser limit because it fires on
# every keystroke in the add-teammate field.

participant_bp.route("/api/participant/teams/lookup", methods=["GET"])(
    require_participant(rate_limit(60)(ParticipantTeamController.lookup))
)

participant_bp.route("/api/participant/teams/create", methods=["POST"])(
    require_participant(rate_limit(15)(ParticipantTeamController.create))
)

participant_bp.route("/api/participant/teams/mine", methods=["GET"])(
    require_participant(rate_limit(60)(ParticipantTeamController.mine))
)

participant_bp.route("/api/participant/teams/respond", methods=["POST"])(
    require_participant(rate_limit(20)(ParticipantTeamController.respond))
)

participant_bp.route("/api/participant/teams/swap", methods=["POST"])(
    require_participant(rate_limit(20)(ParticipantTeamController.swap))
)

participant_bp.route("/api/participant/teams/cancel", methods=["POST"])(
    require_participant(rate_limit(20)(ParticipantTeamController.cancel))
)


# --- health ----------------------------------------------------------------
@participant_bp.route("/api/participant/health", methods=["GET"])
def health():
    """
    Reports whether the zin26 schema is actually reachable.

    Worth its own endpoint because the most likely failure in this phase is not
    a bug but an unapplied migration or an unexposed schema, and that is
    invisible from a normal 500.
    """
    ok, detail = zin26_available()
    return (
        jsonify({"success": ok, "schema": "zin26", "detail": detail}),
        200 if ok else 503,
    )
