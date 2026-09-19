"""
Zinnia 2026 — On-spot Registration Desk Controller

Thin, like AdminPanelController: parse, call services/spot_registration_service,
jsonify. Errors keep the {success, message, error_code} envelope adminFetch
expects, plus whatever fields the desk acts on (field, user_id, warnings).
"""

from __future__ import annotations

from flask import g, jsonify, request

from controllers.admin_panel_controller import _fail
from services import admin_panel_service as panel
from services import spot_registration_service as svc

_STATUS = {
    "NOT_FOUND": 404,
    "DUPLICATE_EMAIL": 409,
    "DUPLICATE_UTR": 409,
    "ALREADY_REGISTERED": 409,
    "EVENT_FULL": 409,
    "EVENT_INACTIVE": 409,
    "CONFIRMATION_REQUIRED": 409,
    "NOT_CAPTAIN": 403,
    "PAYEE_NOT_CONFIGURED": 503,
    "NOT_APPROVED": 409,
    "EMAIL_FAILED": 502,
    "NOT_DESK_REGISTRATION": 403,
}


def _respond(res):
    if res.get("success"):
        return jsonify(res), 200
    return jsonify(res), _STATUS.get(res.get("error_code", ""), 400)


def _body():
    return request.get_json(silent=True) or {}


class SpotRegistrationController:
    @staticmethod
    def register_participant():
        try:
            return _respond(svc.register_participant(_body(), getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def search():
        try:
            return _respond(svc.search(request.args.get("q", ""), getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def person(user_id: str):
        try:
            return _respond(svc.person_detail(user_id, getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def summary():
        try:
            return _respond(panel.spot_summary(getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def send_pass(user_id: str):
        try:
            return _respond(svc.send_pass(user_id))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def payee():
        try:
            return _respond(svc.desk_payee(getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def check_email():
        try:
            return _respond(svc.check_email(request.args.get("email", "")))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def check_member():
        try:
            return _respond(svc.check_member(
                request.args.get("user_id", ""), request.args.get("event", "")
            ))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def register_event():
        try:
            body = _body()
            return _respond(svc.register_event(
                body.get("user_id", ""),
                body.get("event_code", ""),
                confirm_warnings=bool(body.get("confirm_warnings")),
            ))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def create_team():
        try:
            body = _body()
            members = body.get("member_user_ids") or []
            if not isinstance(members, list):
                members = []
            return _respond(svc.create_team(
                body.get("event_code", ""),
                body.get("team_name", ""),
                members,
                topic=body.get("topic", ""),
                confirm_warnings=bool(body.get("confirm_warnings")),
            ))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def cancel_event():
        try:
            body = _body()
            return _respond(svc.cancel_event(body.get("user_id", ""), body.get("event_code", ""),
                                             getattr(g, "admin", None) or {}))
        except Exception as e:
            return _fail(e)
