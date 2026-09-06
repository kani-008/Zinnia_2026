"""
Zinnia 2026 — Phase 5: team event controllers (doc §4.3).

The acting participant always comes from g.participant_user_id, never from the
request body, so a captain cannot act as a teammate or vice versa.
"""

from flask import g, jsonify, request

from controllers.participant_controller import _guard
from services import team_service

_STATUS = {
    "VALIDATION_ERROR": 422,
    "INVALID_USER_ID": 422,
    "NOT_FOUND": 404,
    "TEAM_CANCELLED": 410,
    "NOT_CAPTAIN": 403,
    "ALREADY_RESPONDED": 409,
    "ALREADY_ACCEPTED": 409,
    "DUPLICATE_MEMBER": 409,
    "STILL_WAITING": 409,
    "TEAM_NOT_READY": 409,
    "CONFIRMATION_REQUIRED": 409,
    "CANNOT_SWAP_CAPTAIN": 409,
}


def _respond(result: dict, endpoint: str) -> tuple:
    status = 200 if result.get("success") else _STATUS.get(result.get("error_code"), 400)
    print(f"[Backend API] {endpoint} -> HTTP {status} | {result.get('error_code') or 'OK'}")
    return jsonify(result), status


def _body() -> dict:
    data = request.get_json(silent=True) or {}
    return data if isinstance(data, dict) else {}


class ParticipantTeamController:
    """Team creation, teammate lookup, accept/decline, swap and cancel."""

    @staticmethod
    def lookup():
        endpoint = "GET /api/participant/teams/lookup"
        return _guard(
            endpoint,
            lambda: _respond(
                team_service.lookup_teammate(
                    g.participant_user_id,
                    request.args.get("user_id", ""),
                    request.args.get("event_code", "").strip().upper(),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def create():
        endpoint = "POST /api/participant/teams/create"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                team_service.create_team(
                    g.participant_user_id,
                    str(data.get("event_code", "")).strip().upper(),
                    str(data.get("team_name", "")),
                    list(data.get("member_user_ids") or []),
                    bool(data.get("confirm_warnings", False)),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def mine():
        endpoint = "GET /api/participant/teams/mine"
        return _guard(
            endpoint, lambda: _respond(team_service.my_teams(g.participant_user_id), endpoint)
        )

    @staticmethod
    def respond():
        endpoint = "POST /api/participant/teams/respond"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                team_service.respond_to_invite(
                    g.participant_user_id,
                    str(data.get("team_id", "")),
                    bool(data.get("accept", False)),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def swap():
        endpoint = "POST /api/participant/teams/swap"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                team_service.swap_member(
                    g.participant_user_id,
                    str(data.get("team_id", "")),
                    str(data.get("out_user_id", "")),
                    str(data.get("in_user_id", "")),
                ),
                endpoint,
            ),
        )

    @staticmethod
    def cancel():
        endpoint = "POST /api/participant/teams/cancel"
        data = _body()
        return _guard(
            endpoint,
            lambda: _respond(
                team_service.cancel_team(g.participant_user_id, str(data.get("team_id", ""))),
                endpoint,
            ),
        )
