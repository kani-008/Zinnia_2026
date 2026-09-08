"""
Zinnia 2026 — Phase 3: participant registration controller.

Mirrors the shape of RegistrationController: parse, delegate to the service,
map the service's error_code to an HTTP status. No business logic here.
"""

import requests
from flask import jsonify, request

from services import participant_service
from services.zin26_db import Zin26Error

# error_code -> HTTP status. Anything unmapped is a plain 400.
_STATUS = {
    "VALIDATION_ERROR": 422,
    "INVALID_USER_ID": 422,
    "DUPLICATE_EMAIL": 409,
    "DUPLICATE_UTR": 409,
    "NOT_FOUND": 404,
    "EMAIL_NOT_VERIFIED": 403,
    "NO_PAYMENT": 409,
    "SCREENSHOT_REQUIRED": 422,
    "STORAGE_ERROR": 502,
}


def _respond(result: dict, endpoint: str) -> tuple:
    status = 200 if result.get("success") else _STATUS.get(result.get("error_code"), 400)
    print(f"[Backend API] {endpoint} -> HTTP {status} | {result.get('error_code') or 'OK'}")
    return jsonify(result), status


def _guard(endpoint: str, fn) -> tuple:
    """Shared error envelope. Zin26Error carries its own status; nothing else leaks."""
    try:
        return fn()
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
        # Supabase unreachable - DNS failure, offline, or the project is paused.
        # A generic 500 here reads as a bug in the app when it is the network;
        # say what actually happened so the participant retries instead of
        # filing a report.
        print(f"[Backend API Error] {endpoint} -> HTTP 503 | DB_UNREACHABLE: {type(e).__name__}: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "DB_UNREACHABLE",
                    "message": (
                        "Could not reach the registration database. Check your internet "
                        "connection and try again in a moment."
                    ),
                }
            ),
            503,
        )
    except Zin26Error as e:
        print(f"[Backend API Error] {endpoint} -> HTTP {e.status} | {e.code}: {e.message}")
        return (
            jsonify({"success": False, "error_code": e.code, "message": e.message}),
            e.status,
        )
    except Exception as e:
        print(f"[Backend API Error] {endpoint} -> HTTP 500 | {type(e).__name__}: {e}")
        return (
            jsonify(
                {
                    "success": False,
                    "error_code": "SERVER_ERROR",
                    "message": "Server error processing the request.",
                }
            ),
            500,
        )


class ParticipantController:
    """Stage 1 of the participant flow (doc §4.1)."""

    @staticmethod
    def register():
        """POST /api/participant/register"""
        endpoint = "POST /api/participant/register"
        data = request.get_json(silent=True) or {}
        if not isinstance(data, dict) or not data:
            return (
                jsonify(
                    {"success": False, "error_code": "INVALID_BODY", "message": "Invalid JSON body."}
                ),
                400,
            )
        return _guard(endpoint, lambda: _respond(participant_service.register_participant(data), endpoint))

    @staticmethod
    def submit_payment():
        """POST /api/participant/payment/submit"""
        endpoint = "POST /api/participant/payment/submit"
        # multipart/form-data when a screenshot rides along; JSON otherwise.
        screenshot = request.files.get("screenshot")
        if screenshot is not None or request.form:
            data = {k: v for k, v in request.form.items()}
        else:
            data = request.get_json(silent=True) or {}
        if not isinstance(data, dict) or not data:
            return (
                jsonify(
                    {"success": False, "error_code": "INVALID_BODY", "message": "Invalid request body."}
                ),
                400,
            )
        return _guard(
            endpoint,
            lambda: _respond(participant_service.submit_payment(data, screenshot), endpoint),
        )

    @staticmethod
    def payment_proof():
        """GET /api/participant/payment/proof - the participant's own proof image."""
        endpoint = "GET /api/participant/payment/proof"
        return _guard(endpoint, lambda: _respond(
            participant_service.payment_proof_url(
                user_id=request.args.get("user_id", ""),
                registration_id=request.args.get("registration_id", request.args.get("rid", "")),
            ),
            endpoint,
        ))

    @staticmethod
    def remove_payment_proof():
        """POST /api/participant/payment/proof/remove - delete it so a new one can go up."""
        endpoint = "POST /api/participant/payment/proof/remove"
        body = request.get_json(silent=True) or {}
        return _guard(endpoint, lambda: _respond(
            participant_service.remove_payment_proof(
                user_id=str(body.get("user_id", "")),
                registration_id=str(body.get("registration_id", body.get("rid", ""))),
            ),
            endpoint,
        ))

    @staticmethod
    def payment_status():
        """GET /api/participant/payment/status?user_id=..."""
        endpoint = "GET /api/participant/payment/status"
        user_id = request.args.get("user_id", "")
        return _guard(endpoint, lambda: _respond(participant_service.payment_status(user_id=request.args.get("user_id", ""), registration_id=request.args.get("registration_id", request.args.get("rid", ""))), endpoint))
