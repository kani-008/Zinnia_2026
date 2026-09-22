"""
Reopening event picking after a mistaken "Confirm my events".

    python backend/tests/test_lineup_reopen.py

NOTHING HERE TOUCHES THE REAL DATABASE OR SENDS MAIL: SUPABASE_URL points at a
closed local port before any backend import, every HTTP request raises unless a
test answers it itself, and the zin26 helpers are replaced by an in-memory fake.
"""

import os
import sys
from datetime import datetime
from urllib.parse import parse_qs, urlparse

os.environ["SUPABASE_URL"] = "http://127.0.0.1:9"  # closed port: nothing listens
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-only-not-a-key"
os.environ["SUPABASE_ANON_KEY"] = "test-only-not-a-key"
os.environ["SMTP_USER"] = ""
os.environ["SMTP_PASS"] = ""
os.environ.setdefault("AUTH_SECRET_KEY", "test-only-secret-not-a-real-key")
os.environ.setdefault("QR_SIGNING_SECRET", "test-only-qr-secret")

import requests  # noqa: E402
import smtplib  # noqa: E402


def _blocked(*_a, **_k):
    raise RuntimeError("network access is blocked in this test suite")


requests.sessions.Session.request = _blocked
smtplib.SMTP = _blocked
smtplib.SMTP_SSL = _blocked

_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from flask import Flask, g  # noqa: E402

from services import audit_service  # noqa: E402
from services import event_registration_service as events  # noqa: E402
from services import zin26_db as db  # noqa: E402

assert db.SUPABASE_URL == "http://127.0.0.1:9", "refusing to run: the real Supabase URL leaked in"

PERSON = {
    "user_id": "ZIN26-0257",
    "name": "Test Person",
    "email": "person@x.in",
    "payment_status": "APPROVED",
    "master_qr_token": "tok",
    "food_preference": "VEG",
}


class Resp:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body
        self.text = "" if body is None else str(body)

    def json(self):
        return self._body


class FakeAudit:
    """The audit table, answering exactly the two calls audit_service makes."""

    def __init__(self):
        self.rows = []
        self.fail_reads = False
        self.refuse_writes = False

    def post(self, url, headers=None, timeout=None, json=None):
        assert url.endswith("/rest/v1/admin_audit_log"), url
        if self.refuse_writes:
            return Resp(500, "simulated outage")
        self.rows.append(dict(json, created_at=json.get("created_at") or self.next_time()))
        return Resp(201, None)

    def get(self, url, headers=None, timeout=None):
        if self.fail_reads:
            raise RuntimeError("audit read timed out")
        q = {k: v[0] for k, v in parse_qs(urlparse(url).query).items()}
        rows = [
            r for r in self.rows
            if all(q.get(k) == f"eq.{r.get(k)}" for k in ("action", "target_type", "target_id") if k in q)
        ]
        rows.sort(key=lambda r: datetime.fromisoformat(r["created_at"]), reverse=True)  # as the DB does
        return Resp(200, [{"created_at": r["created_at"]} for r in rows[: int(q.get("limit", 50))]])

    def next_time(self):
        return f"2026-09-22T10:{len(self.rows):02d}:00.123456+00:00"


def _setup():
    audit = FakeAudit()
    audit_service.http = audit
    people = {PERSON["user_id"]: PERSON}
    db.select_one = lambda table, q: (
        people.get(q.split("user_id=eq.")[1].split("&")[0]) if table == "participants" else None
    )
    db.select = lambda table, q: []
    events.capacity_map = lambda: {}
    events.pending_invites = lambda uid: []
    events.held_event_codes = lambda uid: ["PAPER_PRESENTATION"]
    events._send_lineup_confirmation = lambda p, held: True
    return audit


def _as_admin(fn):
    app = Flask(__name__)
    with app.test_request_context():
        g.admin = {"id": "a1", "name": "Admin", "role": "SUPER_ADMIN"}
        return fn()


def test_nobody_reopened_means_no_reopen_time():
    _setup()
    d = events.get_dashboard("ZIN26-0257")
    assert d["success"] and d["lineup_reopened_at"] is None, d.get("lineup_reopened_at")


def test_a_reopen_shows_on_the_dashboard_as_utc_milliseconds():
    audit = _setup()
    out = _as_admin(lambda: events.reopen_lineup("ZIN26-0257", "pressed Confirm by mistake"))
    assert out["success"], out
    assert [r["action"] for r in audit.rows] == ["LINEUP_REOPEN"]
    row = audit.rows[0]
    assert row["target_type"] == "participant" and row["target_id"] == "ZIN26-0257", row
    assert row["reason"] == "pressed Confirm by mistake" and row["detail"] == {"name": "Test Person"}, row
    assert out["reopened_at"] == "2026-09-22T10:00:00.123Z", out
    d = events.get_dashboard("ZIN26-0257")
    assert d["lineup_reopened_at"] == "2026-09-22T10:00:00.123Z", d["lineup_reopened_at"]


def test_only_the_latest_reopen_of_that_participant_counts():
    audit = _setup()
    audit.rows += [
        {"action": "LINEUP_REOPEN", "target_type": "participant", "target_id": "ZIN26-0257",
         "created_at": "2026-09-22T09:00:00+00:00"},
        {"action": "LINEUP_REOPEN", "target_type": "participant", "target_id": "ZIN26-0257",
         "created_at": "2026-09-22T11:30:00.5+05:30"},   # 06:00 UTC: older, despite the digits
        {"action": "LINEUP_REOPEN", "target_type": "participant", "target_id": "ZIN26-0448",
         "created_at": "2026-09-22T12:00:00+00:00"},     # somebody else
        {"action": "PARTICIPANT_DELETE", "target_type": "participant", "target_id": "ZIN26-0257",
         "created_at": "2026-09-22T13:00:00+00:00"},     # another action
    ]
    assert events.lineup_reopened_at("ZIN26-0257") == "2026-09-22T09:00:00.000Z"


def test_a_failed_audit_read_never_breaks_the_dashboard():
    audit = _setup()
    audit.fail_reads = True
    d = events.get_dashboard("ZIN26-0257")
    assert d["success"] and d["lineup_reopened_at"] is None, d


def test_reopening_someone_who_does_not_exist_records_nothing():
    audit = _setup()
    out = _as_admin(lambda: events.reopen_lineup("ZIN26-9999", "typo"))
    assert not out["success"] and out["error_code"] == "NOT_FOUND", out
    assert audit.rows == []


def test_a_reopen_that_was_not_saved_is_not_reported_as_done():
    audit = _setup()
    audit.refuse_writes = True
    out = _as_admin(lambda: events.reopen_lineup("ZIN26-0257", "pressed Confirm by mistake"))
    assert not out["success"] and out["error_code"] == "AUDIT_WRITE_FAILED", out
    assert events.get_dashboard("ZIN26-0257")["lineup_reopened_at"] is None


def test_a_reopen_needs_a_signed_in_admin():
    audit = _setup()
    out = events.reopen_lineup("ZIN26-0257", "no request at all")
    assert not out["success"] and out["error_code"] == "NO_ADMIN_CONTEXT", out
    app = Flask(__name__)
    with app.test_request_context():          # a request, but nobody signed in
        out = events.reopen_lineup("ZIN26-0257", "no admin")
    assert not out["success"] and out["error_code"] == "NO_ADMIN_CONTEXT", out
    assert audit.rows == []


def test_the_admin_endpoint_reopens_and_is_treasurer_only():
    from middleware.auth_middleware import generate_admin_token
    from middleware.error_handler import register_error_handlers
    from routes.admin_routes import admin_bp

    audit = _setup()
    app = Flask(__name__)
    register_error_handlers(app)
    app.register_blueprint(admin_bp)
    client = app.test_client()
    url = "/api/admin/payments/ZIN26-0257/reopen-lineup"

    def as_role(role):
        tok = generate_admin_token({"id": "a1", "username": "x", "name": "X", "role": role})
        return {"Authorization": f"Bearer {tok}"}

    assert client.post(url).status_code == 401
    assert client.post(url, headers=as_role("EVENT_COORDINATOR")).status_code == 403
    assert audit.rows == []
    r = client.post(url, headers=as_role("TREASURER"), json={})
    assert r.status_code == 200 and r.get_json()["success"], r.get_json()
    assert [(a["action"], a["target_id"]) for a in audit.rows] == [("LINEUP_REOPEN", "ZIN26-0257")]
    assert audit.rows[0]["reason"] == "Pressed Confirm my events by mistake"


def test_confirming_says_when_in_the_same_format_as_a_reopen():
    _setup()
    out = events.confirm_lineup("ZIN26-0257")
    assert out["success"], out
    at = out["confirmed_at"]
    assert at.endswith("Z") and len(at) == len("2026-09-22T10:00:00.123Z"), at


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failures = []
    for fn in tests:
        try:
            fn()
            print(f"  PASS  {fn.__name__}")
        except AssertionError as e:
            failures.append((fn.__name__, str(e)))
            print(f"  FAIL  {fn.__name__}\n          {e}")
        except Exception as e:
            failures.append((fn.__name__, f"{type(e).__name__}: {e}"))
            print(f"  ERROR {fn.__name__}\n          {type(e).__name__}: {e}")
    print(f"\n{len(tests) - len(failures)}/{len(tests)} passed")
    if failures:
        print("\nFailed:")
        for name, msg in failures:
            print(f"  - {name}: {msg}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
