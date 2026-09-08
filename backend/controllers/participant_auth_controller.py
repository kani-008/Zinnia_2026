"""
Zinnia 2026 — Phase 4: login and dashboard controllers.

Same shape as ParticipantController: parse, delegate, map error_code to status.
"""

from flask import g, jsonify, request

from controllers.participant_controller import _guard, _respond
from services import event_registration_service as events
from services import participant_auth_service as auth

_AUTH_STATUS = {
    "VALIDATION_ERROR": 422,
    "INVALID_USER_ID": 422,
    "NOT_FOUND": 404,
    "OTP_NOT_FOUND": 410,
    "OTP_EXPIRED": 410,
    "OTP_LOCKED": 429,
    "OTP_INVALID": 401,
}


def _auth_respond(result: dict, endpoint: str) -> tuple:
    status = 200 if result.get("success") else _AUTH_STATUS.get(result.get("error_code"), 400)
    print(f"[Backend API] {endpoint} -> HTTP {status} | {result.get('error_code') or 'OK'}")
    return jsonify(result), status


def _body() -> dict:
    data = request.get_json(silent=True) or {}
    return data if isinstance(data, dict) else {}


class ParticipantAuthController:
    """
    UserID login, second factor by emailed OTP (doc §4.2).

    Login by email address was removed: the UserID is the sole identifier a
    participant may present. `email` is deliberately not read off the request
    body here, so the endpoint cannot be driven by an address even by a caller
    hand-rolling the JSON. `registration_id` stays, because the registration
    flow's own email-verification step rides on the same OTP endpoints before
    a UserID has been handed over.
    """

    @staticmethod
    def request_otp():
        endpoint = "POST /api/participant/auth/request-otp"
        data = _body()
        return _guard(
            endpoint,
            lambda: _auth_respond(
                auth.request_otp(
                    data.get("user_id", ""),
                    registration_id=data.get("registration_id", ""),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def verify_otp():
        endpoint = "POST /api/participant/auth/verify-otp"
        data = _body()
        return _guard(
            endpoint,
            lambda: _auth_respond(
                auth.verify_otp(
                    data.get("user_id", ""),
                    data.get("otp", ""),
                    registration_id=data.get("registration_id", ""),
                ),
                endpoint
            ),
        )


class ParticipantRegistrationVerifyController:
    """Email check between the details form and payment (doc §4.1)."""

    @staticmethod
    def verify_email():
        endpoint = "POST /api/participant/register/verify-email"
        data = _body()
        return _guard(
            endpoint,
            lambda: _auth_respond(
                auth.verify_registration_email(
                    data.get("user_id", ""),
                    data.get("otp", ""),
                    registration_id=data.get("registration_id", ""),
                ),
                endpoint,
            ),
        )


class ParticipantDashboardController:
    """Dashboard and individual event registration (doc §4.3)."""

    @staticmethod
    def dashboard():
        endpoint = "GET /api/participant/dashboard"
        return _guard(
            endpoint, lambda: _respond(events.get_dashboard(g.participant_user_id), endpoint)
        )

    @staticmethod
    def register_event():
        endpoint = "POST /api/participant/events/register"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                events.register_individual(
                    g.participant_user_id,
                    str(data.get("event_code", "")).strip().upper(),
                    bool(data.get("confirm_warnings", False)),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def confirm_lineup():
        endpoint = "POST /api/participant/events/confirm"
        return _guard(
            endpoint,
            lambda: _respond(events.confirm_lineup(g.participant_user_id), endpoint),
        )

    @staticmethod
    def cancel_event():
        endpoint = "POST /api/participant/events/cancel"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                events.cancel_registration(
                    g.participant_user_id, str(data.get("event_code", "")).strip().upper()
                ),
                endpoint,
            ),
        )
