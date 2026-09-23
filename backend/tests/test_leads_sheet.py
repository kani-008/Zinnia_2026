"""
The leads sheet must never be able to break or slow a registration.

Run it directly - there is no pytest in this project:

    python backend/tests/test_leads_sheet.py

Everything here is offline. The Apps Script endpoint is replaced by a fake, the
duplicate-email lookup by a stub, and the OTP email by a stub, so no request
leaves the machine and no database row is read or written.

What is at stake
----------------
The capture sits inside the one function every participant passes through. A
sheet that is down, slow, misconfigured or hostile has to leave registration
exactly as it would have been without it. Each check below is a way it could
fail to.
"""

import os
import sys
import threading
import time

os.environ.setdefault("AUTH_SECRET_KEY", "test-only-secret-not-a-real-key")
os.environ.setdefault("QR_SIGNING_SECRET", "test-only-qr-secret")

_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

from services import leads_sheet  # noqa: E402

DETAILS = {
    "name": "Asha K",
    "email": "asha.leads.test@example.com",
    "phone": "9876543210",
    "college": "GCEE",
    "department": "CSE",
    "year": "III",
    "food_preference": "VEG",
}


def _configure(url="https://script.google.com/macros/s/TEST/exec", key="k-123"):
    if url is None:
        os.environ.pop("LEADS_SHEET_URL", None)
    else:
        os.environ["LEADS_SHEET_URL"] = url
    if key is None:
        os.environ.pop("LEADS_SHEET_KEY", None)
    else:
        os.environ["LEADS_SHEET_KEY"] = key


class FakeResponse:
    def __init__(self, status=200, body=None):
        self.status_code = status
        self._body = {"ok": True} if body is None else body

    def json(self):
        if isinstance(self._body, Exception):
            raise self._body
        return self._body


class FakeEndpoint:
    """Records calls to requests.post and behaves however the test says."""

    def __init__(self, delay=0.0, raises=None, response=None):
        self.delay, self.raises, self.response = delay, raises, response
        self.calls = []

    def __call__(self, url, json=None, timeout=None, **kw):
        self.calls.append({"url": url, "json": json, "timeout": timeout})
        if self.delay:
            time.sleep(self.delay)
        if self.raises:
            raise self.raises
        return self.response or FakeResponse()


def _install(endpoint):
    leads_sheet.requests.post = endpoint
    return endpoint


# --- switched off --------------------------------------------------------------

def test_no_url_is_a_silent_no_op():
    _configure(url=None)
    ep = _install(FakeEndpoint())
    handle = leads_sheet.capture(DETAILS)
    leads_sheet.finish(handle)
    assert handle is None, "nothing should start when the sheet is not configured"
    assert ep.calls == [], "and no request should be made"


def test_url_without_key_is_also_a_no_op():
    """Posting without the key would only ever be refused; do not bother."""
    _configure(key=None)
    ep = _install(FakeEndpoint())
    assert leads_sheet.capture(DETAILS) is None
    assert ep.calls == []


# --- what is sent --------------------------------------------------------------

def test_only_personal_details_are_sent():
    _configure()
    ep = _install(FakeEndpoint())
    leaky = {**DETAILS, "otp": "123456", "h": "hash", "registration_id": "pend1.x.y"}
    leads_sheet.finish(leads_sheet.capture(leaky))

    assert len(ep.calls) == 1
    sent = ep.calls[0]["json"]["details"]
    assert set(sent) == set(leads_sheet.FIELDS), f"sent {sorted(sent)}"
    for secret in ("otp", "h", "registration_id"):
        assert secret not in sent, f"{secret} must never reach a shared spreadsheet"


def test_key_travels_in_the_body_not_the_url():
    _configure(key="k-should-not-be-in-url")
    ep = _install(FakeEndpoint())
    leads_sheet.finish(leads_sheet.capture(DETAILS))
    assert "k-should-not-be-in-url" not in ep.calls[0]["url"], "URLs end up in logs"
    assert ep.calls[0]["json"]["key"] == "k-should-not-be-in-url"


def test_every_request_has_a_timeout():
    """An unbounded request is how a slow Google turns into a hung function."""
    _configure()
    ep = _install(FakeEndpoint())
    leads_sheet.finish(leads_sheet.capture(DETAILS))
    assert ep.calls[0]["timeout"] is not None


# --- failure never surfaces ----------------------------------------------------

def test_a_crashing_endpoint_never_raises():
    _configure()
    _install(FakeEndpoint(raises=ConnectionError("google is down")))
    leads_sheet.finish(leads_sheet.capture(DETAILS))  # must not raise


def test_an_error_status_never_raises():
    _configure()
    _install(FakeEndpoint(response=FakeResponse(status=500)))
    leads_sheet.finish(leads_sheet.capture(DETAILS))


def test_a_non_json_answer_never_raises():
    """What a web app deployed as 'Only myself' actually returns: a login page."""
    _configure()
    _install(FakeEndpoint(response=FakeResponse(body=ValueError("html"))))
    leads_sheet.finish(leads_sheet.capture(DETAILS))


def test_a_refused_row_never_raises():
    _configure()
    _install(FakeEndpoint(response=FakeResponse(body={"ok": False, "error": "unauthorized"})))
    leads_sheet.finish(leads_sheet.capture(DETAILS))


# --- the deadline --------------------------------------------------------------

def test_a_slow_sheet_cannot_hold_the_request_past_the_deadline():
    _configure()
    original = leads_sheet.DEADLINE_SECONDS
    leads_sheet.DEADLINE_SECONDS = 0.5
    try:
        _install(FakeEndpoint(delay=5.0))
        start = time.monotonic()
        leads_sheet.finish(leads_sheet.capture(DETAILS))
        waited = time.monotonic() - start
    finally:
        leads_sheet.DEADLINE_SECONDS = original
    assert waited < 1.5, f"finish waited {waited:.2f}s against a 0.5s deadline"


def test_the_deadline_counts_from_capture_not_from_finish():
    """
    The OTP email usually takes longer than the budget. When it has, finish()
    must not add a second full wait on top of it.
    """
    _configure()
    original = leads_sheet.DEADLINE_SECONDS
    leads_sheet.DEADLINE_SECONDS = 0.5
    try:
        _install(FakeEndpoint(delay=5.0))
        handle = leads_sheet.capture(DETAILS)
        time.sleep(0.6)                      # the "email" took longer than the budget
        start = time.monotonic()
        leads_sheet.finish(handle)
        extra = time.monotonic() - start
    finally:
        leads_sheet.DEADLINE_SECONDS = original
    assert extra < 0.2, f"finish added {extra:.2f}s after the budget had already run out"


# --- inside the real registration function -------------------------------------

def _registration_harness(sheet_endpoint, email_behaviour="ok"):
    """Run the real register_participant with its outside world stubbed."""
    import datetime as real_dt
    import types

    from services import participant_service as ps
    from services import participant_auth_service as auth
    from services.email_service import RecipientRefused

    ps.db.select_one = lambda *a, **k: None          # no existing participant

    # These tests are about the leads sheet, not the calendar: the clock is held
    # while the website is open, so they keep passing after registration closes.
    fixed = real_dt.datetime.fromisoformat("2026-09-20T10:00:00+05:30")

    class Frozen(real_dt.datetime):
        @classmethod
        def now(cls, tz=None):
            return fixed.astimezone(tz) if tz else fixed

    ps.dt = types.SimpleNamespace(
        datetime=Frozen, timezone=real_dt.timezone, timedelta=real_dt.timedelta)

    def fake_send(details, otp):
        if email_behaviour == "refused":
            raise RecipientRefused("no such mailbox")
        time.sleep(0.05)
        return True

    auth.send_pending_otp_email = fake_send
    _install(sheet_endpoint)
    return ps.register_participant(dict(DETAILS))


def test_registration_succeeds_when_the_sheet_is_broken():
    _configure()
    result = _registration_harness(FakeEndpoint(raises=RuntimeError("boom")))
    assert result.get("success") is True, result
    assert result.get("registration_id", "").startswith("pend1."), "the real token must still come back"


def test_registration_is_unchanged_when_the_sheet_is_off():
    _configure(url=None)
    result = _registration_harness(FakeEndpoint(raises=AssertionError("must not be called")))
    assert result.get("success") is True, result


def test_registration_is_not_held_up_by_a_slow_sheet():
    _configure()
    original = leads_sheet.DEADLINE_SECONDS
    leads_sheet.DEADLINE_SECONDS = 0.5
    try:
        start = time.monotonic()
        result = _registration_harness(FakeEndpoint(delay=10.0))
        took = time.monotonic() - start
    finally:
        leads_sheet.DEADLINE_SECONDS = original
    assert result.get("success") is True, result
    assert took < 2.0, f"registration took {took:.2f}s behind a 10s sheet"


def test_the_sheet_receives_the_submission_during_registration():
    _configure()
    ep = FakeEndpoint()
    result = _registration_harness(ep)
    assert result.get("success") is True
    assert len(ep.calls) == 1, f"expected one capture, got {len(ep.calls)}"
    assert ep.calls[0]["json"]["details"]["email"] == DETAILS["email"]


def test_an_undeliverable_email_still_returns_its_own_error():
    """The capture must not swallow or replace the answer the participant needs."""
    _configure()
    result = _registration_harness(FakeEndpoint(), email_behaviour="refused")
    assert result.get("success") is False
    assert result.get("error_code") == "EMAIL_UNDELIVERABLE", result


def test_a_normal_capture_finishes_before_registration_returns():
    """
    Only the NORMAL case. A sheet slower than the deadline does leave its
    daemon thread running after finish() returns - Python cannot kill a
    thread - and on Vercel that thread is frozen with the function. That is
    the designed trade: the row may be lost, the participant is never held.
    """
    _configure()
    original = leads_sheet.DEADLINE_SECONDS
    leads_sheet.DEADLINE_SECONDS = 0.3
    try:
        before = {t.ident for t in threading.enumerate()}
        _registration_harness(FakeEndpoint(delay=0.1))
        time.sleep(0.2)
        lingering = [t for t in threading.enumerate()
                     if t.name == "leads-sheet" and t.ident not in before]
    finally:
        leads_sheet.DEADLINE_SECONDS = original
    assert not lingering, f"{len(lingering)} capture thread(s) still alive"


def main() -> int:
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
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
