"""
Zinnia 2026 — Admin Panel Controller

Thin: parse the request, call the service, jsonify. Every response keeps the
{success, message, error_code, ...payload} envelope the rest of the API uses,
because the frontend's adminFetch wrapper depends on it being uniform.
"""

from __future__ import annotations

import re

from flask import Response, g, jsonify, request, send_file

from services import admin_panel_service as svc
from services import audit_service
from services import export_service
from services.zin26_db import Zin26Error


def _fail(e: Exception):
    """zin26 errors carry a participant-facing message and a status."""
    if isinstance(e, Zin26Error):
        raw = e.message or ""
        # PGRST205/PGRST202: the view or function this screen reads does not
        # exist. Almost always means migration 009 has not been applied, and a
        # raw PostgREST 404 sends people looking for the wrong problem.
        if "PGRST205" in raw or "PGRST202" in raw or "Could not find the function" in raw:
            # Take the name from "Could not find the table/function 'X'".
            # PostgREST also emits a "Perhaps you meant 'zin26.event_blocks'"
            # hint, and matching the first quoted name picks up that suggestion
            # instead of the thing that is actually absent.
            missing = ""
            m = (
                re.search(r"Could not find the (?:table|view) '([^']+)'", raw)
                or re.search(r"Could not find the function ([a-z0-9_.]+)", raw)
                or re.search(r"^\w+ ([a-z0-9_]+) failed", raw)
            )
            if m:
                missing = f" ({m.group(1)} is missing)"
            return jsonify({
                "success": False,
                "error_code": "MIGRATION_MISSING",
                "message": (
                    f"This screen's database views have not been created yet{missing}. "
                    f"Check that the zin26 schema is exposed in Supabase (Settings -> API -> Exposed schemas), "
                    f"then reload."
                ),
            }), 503
        return jsonify({"success": False, "error_code": e.code, "message": e.message}), e.status
    print(f"[AdminPanel] unhandled: {type(e).__name__}: {e}")
    return jsonify({
        "success": False,
        "error_code": "INTERNAL_ERROR",
        "message": "Something went wrong. Please try again.",
    }), 500


class AdminPanelController:
    # ---------------------------------------------------------------- session
    @staticmethod
    def me():
        return jsonify({"success": True, "user": g.admin}), 200

    # -------------------------------------------------------------- dashboard
    @staticmethod
    def dashboard():
        try:
            mode = request.args.get("mode", "registration")
            return jsonify(svc.dashboard(mode, g.admin)), 200
        except Exception as e:
            return _fail(e)

    # ----------------------------------------------------------------- events
    @staticmethod
    def list_events():
        try:
            return jsonify(svc.list_events(g.admin)), 200
        except Exception as e:
            return _fail(e)

    @staticmethod
    def patch_event(code: str):
        try:
            body = request.get_json(silent=True) or {}
            res = svc.set_capacity(
                code,
                capacity=body.get("capacity", "__unset__"),
                reg_closes_at=body.get("reg_closes_at", "__unset__"),
                capacity_unit=body.get("capacity_unit"),
            )
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def close_event(code: str):
        try:
            body = request.get_json(silent=True) or {}
            res = svc.set_open(code, is_open=False, reason=body.get("reason", ""))
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def open_event(code: str):
        try:
            body = request.get_json(silent=True) or {}
            res = svc.set_open(
                code,
                is_open=True,
                reason=body.get("reason", ""),
                acknowledge_overfill=bool(body.get("acknowledge_overfill")),
            )
            return jsonify(res), 200 if res.get("success") else 409
        except Exception as e:
            return _fail(e)

    @staticmethod
    def event_roster(code: str):
        try:
            res = svc.event_roster(code, g.admin)
            return jsonify(res), 200 if res.get("success") else 403
        except Exception as e:
            return _fail(e)

    # --------------------------------------------------------------- payments
    @staticmethod
    def payments():
        try:
            return jsonify(svc.payments_queue(
                status=request.args.get("status", "PENDING"),
                q=request.args.get("q", ""),
                flag=request.args.get("flag", ""),
                page=int(request.args.get("page", 1) or 1),
                page_size=int(request.args.get("page_size", 0) or svc.QUEUE_PAGE_SIZE),
            )), 200
        except Exception as e:
            return _fail(e)

    @staticmethod
    def payment_detail(user_id: str):
        try:
            res = svc.payment_detail(user_id)
            return jsonify(res), 200 if res.get("success") else 404
        except Exception as e:
            return _fail(e)

    @staticmethod
    def payment_screenshot(user_id: str):
        try:
            res = svc.screenshot_url(user_id)
            return jsonify(res), 200 if res.get("success") else 404
        except Exception as e:
            return _fail(e)

    @staticmethod
    def payment_proof():
        """
        Stream a Drive-stored proof image.

        Deliberately not behind require_role: an <img src> sends no
        Authorization header, so the signed ?t= token IS the authorisation. It
        names one file, expires in five minutes, and is only ever handed out by
        screenshot_url(), which is role-gated.
        """
        from flask import Response, request as flask_request

        from services import drive_storage as drive

        file_id = drive.open_proxy_token((flask_request.args.get("t") or "").strip())
        if not file_id:
            # Plain text, not JSON: this response lands in an <img>, and a JSON
            # body there is invisible. The header is what a diagnostic fetch or
            # the panel's own retry reads.
            return Response("proof link expired", status=403, mimetype="text/plain",
                            headers={"X-Proof-Error": "TOKEN_EXPIRED"})

        # A Drive file id is immutable in this app - replacing a screenshot
        # uploads a new file and stores a new id - so the id IS the version.
        # That makes revalidation free: a returning treasurer gets a ~40-byte
        # 304 and the browser paints from cache, with no call to Google at all.
        etag = f'"{file_id}"'
        if flask_request.headers.get("If-None-Match") == etag:
            return Response(status=304, headers={
                "ETag": etag,
                "Cache-Control": "private, max-age=240",
            })

        try:
            data, mime = drive.fetch(file_id)
        except Exception as e:
            print(f"[proof] Drive fetch failed for {file_id}: {type(e).__name__}: {e}")
            return Response("proof unavailable", status=502, mimetype="text/plain",
                            headers={"X-Proof-Error": "UPSTREAM_UNAVAILABLE"})

        return Response(
            data,
            mimetype=mime,
            headers={
                # private: the token names one file for one viewer, so a shared
                # cache must not keep a copy. max-age stays under the token TTL
                # so the cached copy always dies before the URL that fetched it.
                "Cache-Control": "private, max-age=240",
                "ETag": etag,
                "Content-Length": str(len(data)),
            },
        )

    @staticmethod
    def approve_payment(user_id: str):
        try:
            res = svc.review_payment(user_id, approve=True)
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def reject_payment(user_id: str):
        try:
            body = request.get_json(silent=True) or {}
            reason = (body.get("reason") or "").strip()
            if not reason:
                return jsonify({
                    "success": False,
                    "error_code": "REASON_REQUIRED",
                    "message": "A reason is required - it is sent to the participant.",
                }), 400
            res = svc.review_payment(user_id, approve=False, reason=reason)
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def bypass_payment(user_id: str):
        """
        Approve without a bank check, for money taken in cash.

        The reason is mandatory and is not a formality: it is stored on the
        payment and is the only thing that afterwards separates this from an
        approval checked against a statement.
        """
        try:
            body = request.get_json(silent=True) or {}
            reason = (body.get("reason") or "").strip()
            if not reason:
                return jsonify({
                    "success": False,
                    "error_code": "REASON_REQUIRED",
                    "message": "Say how this payment was received - it is the record that it was not bank-verified.",
                }), 400
            res = svc.review_payment(user_id, approve=True, reason=reason, bypass=True)
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def resend_pass(user_id: str):
        try:
            res = svc.resend_pass(user_id)
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    @staticmethod
    def bulk_approve():
        try:
            body = request.get_json(silent=True) or {}
            res = svc.bulk_approve(body.get("user_ids") or [])
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    # ---------------------------------------------------------------- exports
    @staticmethod
    def export_preview():
        try:
            body = request.get_json(silent=True) or {}
            return jsonify(export_service.preview(
                body.get("sheets") or [], body.get("filters") or {}, g.admin
            )), 200
        except Exception as e:
            return _fail(e)

    @staticmethod
    def sync_rows():
        """
        Read-only JSON mirror of the workbook, for the Google Sheets sync.

        Guarded by require_sync_key, not require_auth — see the note there.
        `?sheets=participants,teams` narrows the groups; omitted means all.
        """
        try:
            raw = (request.args.get("sheets") or "").strip()
            sheets = [s.strip() for s in raw.split(",") if s.strip()] or None
            return jsonify(export_service.sync_payload(sheets=sheets, admin=g.admin)), 200
        except Exception as e:
            return _fail(e)

    @staticmethod
    def export_workbook():
        try:
            body = request.get_json(silent=True) or {}
            buf, filename, _counts = export_service.build_workbook(
                sheets=body.get("sheets") or ["participants"],
                filters=body.get("filters") or {},
                admin=g.admin,
                only_event=body.get("event") or "",
            )
            return send_file(
                buf,
                as_attachment=True,
                download_name=filename,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        except Exception as e:
            return _fail(e)

    @staticmethod
    def export_event(code: str):
        try:
            admin = g.admin
            if (admin.get("role") or "").upper() == "EVENT_COORDINATOR" \
                    and code not in (admin.get("allowed_events") or []):
                return jsonify({"success": False, "error_code": "FORBIDDEN",
                                "message": "You are not a coordinator for this event."}), 403
            buf, filename, _ = export_service.build_workbook(
                sheets=["events"], filters={}, admin=admin, only_event=code
            )
            return send_file(
                buf,
                as_attachment=True,
                download_name=filename,
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        except Exception as e:
            return _fail(e)

    # --------------------------------------------------------------- settings
    @staticmethod
    def get_settings():
        try:
            return jsonify(svc.get_settings()), 200
        except Exception as e:
            return _fail(e)

    @staticmethod
    def patch_settings():
        try:
            body = request.get_json(silent=True) or {}
            res = svc.update_settings(body.get("settings") or body)
            return jsonify(res), 200 if res.get("success") else 400
        except Exception as e:
            return _fail(e)

    # ------------------------------------------------------------------ audit
    @staticmethod
    def audit():
        try:
            return jsonify({
                "success": True,
                "entries": audit_service.recent(
                    limit=int(request.args.get("limit", 50) or 50),
                    offset=int(request.args.get("offset", 0) or 0),
                ),
            }), 200
        except Exception as e:
            return _fail(e)
