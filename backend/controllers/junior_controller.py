"""
Zinnia 2026 — Junior invites controller (super admin only).

Thin: parse, call services/junior_service, jsonify, in the {success, message,
error_code} envelope adminFetch expects.
"""

from __future__ import annotations

from flask import g, jsonify, request

from controllers.admin_panel_controller import _fail
from services import junior_service as svc

_STATUS = {
    "BAD_SHEET": 400,
    "VALIDATION_ERROR": 400,
    "NOT_FOUND": 404,
    "LUNCH_TAKEN": 409,
    "BUSY": 409,
    "ALREADY_SENT": 409,
    "EMAIL_FAILED": 502,
}


def _respond(res):
    if res.get("success"):
        return jsonify(res), 200
    return jsonify(res), _STATUS.get(res.get("error_code", ""), 400)


def _admin():
    return getattr(g, "admin", None) or {}


class JuniorController:
    @staticmethod
    def preview():
        try:
            upload = request.files.get("file")
            if upload is None or not getattr(upload, "filename", ""):
                return _respond(svc._fail("BAD_SHEET", "Choose the juniors' sheet (.xlsx or .csv)."))
            # Read one byte past the limit, so an oversized file is refused without
            # pulling all of it into memory.
            data = upload.stream.read(svc.MAX_UPLOAD_BYTES + 1)
            return _respond(svc.preview(upload.filename, data))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def add():
        try:
            body = request.get_json(silent=True) or {}
            return _respond(svc.add(body.get("rows"), _admin()))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def listing():
        try:
            return _respond(svc.listing())
        except Exception as e:
            return _fail(e)

    @staticmethod
    def send(junior_id: str):
        try:
            body = request.get_json(silent=True) or {}
            return _respond(svc.send(junior_id, _admin(), resend=body.get("resend") is True))
        except Exception as e:
            return _fail(e)

    @staticmethod
    def remove(junior_id: str):
        try:
            return _respond(svc.remove(junior_id, _admin()))
        except Exception as e:
            return _fail(e)
