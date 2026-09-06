"""
Zinnia 2026 — Phase 4: participant session guard.

Separate from auth_middleware's admin guard on purpose. Both sign with
AUTH_SECRET_KEY, so the audience claim is what keeps an admin token from
authenticating as a participant and vice versa.
"""

from functools import wraps

from flask import g, jsonify, request

from services.participant_auth_service import decode_participant_token


def require_participant(f):
    """
    Populates g.participant_user_id from the bearer token.

    Always 401 on failure, never 403 — the frontend clears its stored session
    on a 401, which is exactly the right response to an expired 30-day token.
    """

    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return (
                jsonify(
                    {
                        "success": False,
                        "error_code": "UNAUTHENTICATED",
                        "message": "Log in to continue.",
                    }
                ),
                401,
            )

        ok, payload, error = decode_participant_token(header[7:].strip())
        if not ok:
            return (
                jsonify({"success": False, "error_code": "UNAUTHENTICATED", "message": error}),
                401,
            )

        g.participant_user_id = payload["sub"]
        return f(*args, **kwargs)

    return wrapper
