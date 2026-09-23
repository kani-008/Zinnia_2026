"""
The on-spot registration desk (admin panel): does it register walk-ins after
the website has closed, without loosening anything else?

Run it directly - there is no pytest in this project and no CI:

    python backend/tests/test_spot_registration.py

Bare asserts and a main(), matching the other suites here.

NOTHING HERE TOUCHES THE REAL DATABASE. The production Supabase project is
live, so this suite is built to be unable to reach it even by mistake:

  * SUPABASE_URL is pointed at a closed local port BEFORE any backend import,
    so nothing that loads .env afterwards can swap the real one back in;
  * every HTTP request and SMTP connection is replaced with one that raises;
  * the zin26 table helpers (select/insert/update/delete) and the two
    database functions are replaced with an in-memory fake that mirrors the
    constraints the desk relies on: unique email, unique UTR, one live row per
    person per event, and the capacity rule of register_participant_event.

What is actually at stake
-------------------------
The desk lifts exactly one rule - the close date - for exactly one kind of
caller. Every check below exists because a plausible implementation either
lifts too much (the website reopens, Short Film reopens, the 3-event cap goes)
or too little (the desk refuses walk-ins on the day it exists for).
"""

import datetime as real_dt
import itertools
import os
import re
import sys
import types
import uuid
from urllib.parse import unquote

# --- isolation, before ANY backend import ------------------------------------
os.environ["SUPABASE_URL"] = "http://127.0.0.1:9"  # closed port: nothing listens
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-only-not-a-key"
os.environ["SUPABASE_ANON_KEY"] = "test-only-not-a-key"
os.environ["SMTP_USER"] = ""
os.environ["SMTP_PASS"] = ""
os.environ["LEADS_SHEET_URL"] = ""
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

from services import zin26_db as db  # noqa: E402
from services import rules_engine as rules  # noqa: E402
from services import event_registration_service as regs  # noqa: E402
from services import participant_service as participants  # noqa: E402
from services import spot_registration_service as spot  # noqa: E402
from services import admin_panel_service as panel  # noqa: E402
from services import email_service  # noqa: E402
from services.zin26_db import Zin26Error  # noqa: E402

assert db.SUPABASE_URL == "http://127.0.0.1:9", "refusing to run: the real Supabase URL leaked in"

ADMIN = {"id": "7b0c5f7e-6d3a-4d1e-9b7e-2f0f3c9a1a11", "name": "Desk Treasurer", "role": "TREASURER"}
WEBSITE_CLOSED = "2026-09-24T10:00:00+05:30"  # fest morning
WEBSITE_OPEN = "2026-09-17T10:00:00+05:30"

# The desk's own UPI accounts, set for every test - plus a website account that
# must never be used at the desk.
DESK_ENV = {
    "SPOT_DESK_1_UPI_ID": "desk1@upi", "SPOT_DESK_1_ADMIN": "onspot1",
    "SPOT_DESK_2_UPI_ID": "desk2@upi", "SPOT_DESK_2_ADMIN": "onspot2",
    "TREASURER_UPI_ID": "website@upi",
    # Every other desk slot blanked, so the real .env's desks never leak in.
    **{f"SPOT_DESK_{n}_{part}": "" for n in range(3, 10) for part in ("UPI_ID", "ADMIN")},
}
ONSPOT1 = {"id": "11111111-1111-4111-8111-111111111111", "username": "onspot1", "name": "On-spot Desk 1",
           "role": "SPOT_DESK"}
ONSPOT2 = {"id": "22222222-2222-4222-8222-222222222222", "username": "onspot2", "name": "On-spot Desk 2",
           "role": "SPOT_DESK"}


# ==============================================================================
# In-memory zin26
# ==============================================================================

class FakeDB:
    def __init__(self):
        self.tables = {t: [] for t in (
            "participants", "payments", "registrations", "teams", "team_members", "events", "login_otps")}
        self.ids = itertools.count(1)
        self.serial = itertools.count(101)
        self.fail_next_insert = {}
        self.fail_next_update = {}
        for e in rules.EVENTS.values():
            self.tables["events"].append({
                "code": e.code, "name": e.name, "is_active": True,
                "capacity": e.capacity, "max_team": e.max_team, "reg_closes_at": e.reg_closes_at,
            })

    # -- query strings ---------------------------------------------------------
    @staticmethod
    def _parse(query):
        filters, order, limit = [], None, None
        for part in (query or "").split("&"):
            if not part or "=" not in part:
                continue
            key, value = part.split("=", 1)
            if key == "select":
                continue
            if key == "order":
                col, _, direction = value.partition(".")
                order = (col, direction == "desc")
            elif key == "limit":
                limit = int(value)
            else:
                filters.append((key, value))
        return filters, order, limit

    @staticmethod
    def _match(row, key, expr):
        value = row.get(key)
        if expr == "is.null":
            return value is None
        if expr == "not.is.null":
            return value is not None
        op, _, raw = expr.partition(".")
        if op == "in":
            items = [unquote(x) for x in raw.strip("()").split(",")]
            return str(value) in items
        raw = unquote(raw)
        if op == "eq":
            return str(value) == raw if not isinstance(value, bool) else str(value).lower() == raw
        if op == "neq":
            return str(value) != raw
        if op in ("ilike", "like"):
            pattern = "^" + ".*".join(re.escape(p) for p in raw.split("*")) + "$"
            flags = re.I if op == "ilike" else 0
            return value is not None and re.match(pattern, str(value), flags) is not None
        raise AssertionError(f"fake db does not understand {key}={expr}")

    def _rows(self, table, query):
        filters, order, limit = self._parse(query)
        rows = [r for r in self.tables[table] if all(self._match(r, k, e) for k, e in filters)]
        if order:
            rows.sort(key=lambda r: str(r.get(order[0]) or ""), reverse=order[1])
        return rows[:limit] if limit else rows

    # -- helpers the services call -----------------------------------------------
    def select(self, table, query="select=*"):
        return [dict(r) for r in self._rows(table, query)]

    def select_one(self, table, query):
        rows = self.select(table, query)
        return rows[0] if rows else None

    def _now(self):
        return f"2026-09-24T10:{next(self.ids):02d}:00+00:00"

    def insert(self, table, payload):
        failure = self.fail_next_insert.pop(table, None)
        if failure:
            raise failure if isinstance(failure, Exception) else Zin26Error(f"insert {table} failed: HTTP 500 simulated")
        out = []
        for item in payload if isinstance(payload, list) else [payload]:
            row = dict(item)
            if table == "participants":
                if any(p["email"] == row["email"] or p["user_id"] == row["user_id"]
                       for p in self.tables[table]):
                    raise Zin26Error("duplicate: 23505", status=409, code="DUPLICATE")
                row.setdefault("master_qr_token", str(uuid.uuid4()))
            if table == "payments":
                if row.get("txn_ref") and any(p.get("txn_ref") == row["txn_ref"] for p in self.tables[table]):
                    raise Zin26Error("duplicate: 23505 uq_payments_txn_ref", status=409, code="DUPLICATE")
                row["id"] = next(self.ids)
            if table == "registrations":
                if any(r["user_id"] == row["user_id"] and r["event_code"] == row["event_code"]
                       and r["status"] != "CANCELLED" for r in self.tables[table]):
                    raise Zin26Error("duplicate: 23505", status=409, code="DUPLICATE")
                row["reg_id"] = next(self.ids)
                row.setdefault("source", "ONLINE")
                row.setdefault("team_id", None)
            if table == "teams" and any(t["team_id"] == row["team_id"] for t in self.tables[table]):
                raise Zin26Error("duplicate: 23505", status=409, code="DUPLICATE")
            if table == "team_members":
                row.setdefault("invited_at", self._now())
            row.setdefault("created_at", self._now())
            self.tables[table].append(row)
            out.append(dict(row))
        return out

    def update(self, table, query, payload):
        if self.fail_next_update.pop(table, None):
            raise Zin26Error(f"update {table} failed: HTTP 500 simulated")
        rows = self._rows(table, query)
        for r in rows:
            r.update(payload)
        return [dict(r) for r in rows]

    def delete(self, table, query):
        rows = self._rows(table, query)
        self.tables[table] = [r for r in self.tables[table] if r not in rows]
        if table == "participants":  # ON DELETE CASCADE
            gone = {r["user_id"] for r in rows}
            for child in ("payments", "registrations", "login_otps"):
                self.tables[child] = [r for r in self.tables[child] if r["user_id"] not in gone]
        return rows

    def count(self, table, query):
        return len(self._rows(table, query))

    # -- the database functions ---------------------------------------------------
    def rpc_register(self, user_id, event_code, team_id=None, status="CONFIRMED", source="ONLINE", *, closed):
        """Mirror of zin26.register_participant_event (migration 013)."""
        ev = next((e for e in self.tables["events"] if e["code"] == event_code), None)
        if not ev or not ev["is_active"] or closed:
            raise Zin26Error("Unknown event", status=404, code="UNKNOWN_EVENT")
        live = [r for r in self.tables["registrations"] if r["event_code"] == event_code and r["status"] != "CANCELLED"]
        if any(r["user_id"] == user_id for r in live):
            raise Zin26Error("Already registered", status=409, code="ALREADY_REGISTERED")
        if ev["capacity"] is not None:
            taken = len({r["team_id"] for r in live if r["team_id"]}) if ev["max_team"] > 1 else len(live)
            if taken >= ev["capacity"] and not (team_id and any(r["team_id"] == team_id for r in live)):
                raise Zin26Error("Event full", status=409, code="EVENT_FULL")
        row = self.insert("registrations", {"user_id": user_id, "event_code": event_code,
                                            "team_id": team_id, "status": status, "source": source})
        return str(row[0]["reg_id"])

    def rpc_cancel(self, user_id, event_code, event_name):
        """Mirror of zin26.cancel_participant_event (migration 013)."""
        reg = next((r for r in self.tables["registrations"] if r["user_id"] == user_id
                    and r["event_code"] == event_code and r["status"] != "CANCELLED"), None)
        if not reg:
            raise Zin26Error(f"You are not registered for {event_name}.", status=404, code="NOT_REGISTERED")
        if reg["team_id"]:
            team = next(t for t in self.tables["teams"] if t["team_id"] == reg["team_id"])
            if team["captain_user_id"] != user_id:
                raise Zin26Error("Only the team captain can cancel.", status=403, code="NOT_CAPTAIN")
            rows = [r for r in self.tables["registrations"] if r["team_id"] == reg["team_id"] and r["status"] != "CANCELLED"]
            team["status"] = "CANCELLED"
        else:
            rows = [reg]
        for r in rows:
            r["status"] = "CANCELLED"
        return len(rows)


class Harness:
    """Installs a FakeDB and freezes the clock; undo() restores everything."""

    def __init__(self, now_iso=WEBSITE_CLOSED):
        self.fake = FakeDB()
        self.closed = real_dt.datetime.fromisoformat(now_iso) > real_dt.datetime.fromisoformat(rules._CLOSES_DEFAULT)
        self.emails, self.audit, self.pass_wording = [], [], []
        self._saved = []
        self._env = {k: os.environ.get(k) for k in DESK_ENV}
        os.environ.update(DESK_ENV)

        self._patch(db, "select", self.fake.select)
        self._patch(db, "select_one", self.fake.select_one)
        self._patch(db, "insert", self.fake.insert)
        self._patch(db, "update", self.fake.update)
        self._patch(db, "delete", self.fake.delete)
        self._patch(db, "count", self.fake.count)
        self._patch(regs, "rpc_register",
                    lambda *a, **k: self.fake.rpc_register(*a, closed=self.closed, **k))
        self._patch(regs, "rpc_cancel", self.fake.rpc_cancel)
        self._patch(participants, "_next_user_id",
                    lambda: participants.build_user_id(next(self.fake.serial)))
        self._patch(email_service, "send_master_qr_email", self._send_pass)
        self._patch(spot, "log_action", lambda *a, **k: self.audit.append((a, k)))
        self._patch(panel, "log_action", lambda *a, **k: self.audit.append((a, k)))

        fixed = real_dt.datetime.fromisoformat(now_iso)

        class Frozen(real_dt.datetime):
            @classmethod
            def now(cls, tz=None):
                return fixed

        self._patch(rules, "_dt", types.SimpleNamespace(
            datetime=Frozen, timezone=real_dt.timezone, timedelta=real_dt.timedelta))
        self._patch(spot, "_utcnow", lambda: fixed)
        self._patch(participants, "dt", types.SimpleNamespace(
            datetime=Frozen, timezone=real_dt.timezone, timedelta=real_dt.timedelta))

    def _send_pass(self, participant, on_spot=False):
        self.emails.append(participant.get("email"))
        self.pass_wording.append(on_spot)
        return {"success": True}

    def _patch(self, module, name, value):
        self._saved.append((module, name, getattr(module, name)))
        setattr(module, name, value)

    def undo(self):
        for module, name, value in reversed(self._saved):
            setattr(module, name, value)
        for k, v in self._env.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    def walk_in(self, email="walk.in@test.com", method="CASH", admin=None, **overrides):
        if method == "UPI":
            overrides.setdefault("payee_key", "D1")  # the QR the desk showed
        data = {
            "name": "Walk In", "email": email, "phone": "9876543210", "college": "GCEE",
            "department": "CSE", "year": "III", "food_preference": "VEG",
            "payment_method": method, **overrides,
        }
        return spot.register_participant(data, admin or ADMIN)


def with_harness(now_iso=WEBSITE_CLOSED):
    def wrap(fn):
        def run():
            h = Harness(now_iso)
            try:
                fn(h)
            finally:
                h.undo()
        run.__name__ = fn.__name__
        return run
    return wrap


# ==============================================================================
# New walk-ins
# ==============================================================================

@with_harness()
def test_cash_walk_in_is_created_approved_at_the_spot_fee(h):
    res = h.walk_in()
    assert res["success"], res
    uid = res["participant"]["user_id"]
    assert participants.is_valid_user_id(uid), uid

    person = h.fake.select_one("participants", f"user_id=eq.{uid}")
    assert person["payment_status"] == "APPROVED"

    pay = h.fake.select_one("payments", f"user_id=eq.{uid}")
    assert pay["status"] == "APPROVED" and float(pay["amount"]) == float(spot.ON_SPOT_FEE)
    assert pay["approval_note"].startswith(spot.SPOT_NOTE_PREFIX) and "Cash" in pay["approval_note"]
    assert not pay.get("txn_ref"), "cash has no bank reference - a made-up one would pollute reconciliation"
    assert pay.get("approved_by") == ADMIN["id"]

    assert h.emails == ["walk.in@test.com"], "the pass goes out straight away"
    assert h.pass_wording == [True], "the pass mail must use the desk wording, not 'pick your events online'"
    assert h.audit and h.audit[0][0][0] == "SPOT_REGISTER"
    assert not h.fake.tables["login_otps"], "no email code was sent, so nothing may claim the address is verified"


@with_harness()
def test_a_upi_walk_in_needs_no_utr_the_received_tick_is_the_check(h):
    """The treasurer checks the payer's UPI success screen and ticks "received"."""
    res = h.walk_in(method="UPI")
    assert res["success"], res
    pay = h.fake.tables["payments"][0]
    assert pay["status"] == "APPROVED" and "UPI" in pay["approval_note"], pay
    assert not pay.get("txn_ref"), pay


@with_harness()
def test_a_utr_sent_by_an_old_desk_page_is_ignored(h):
    """No UTR is stored, so two walk-ins can never collide on one."""
    for n in (1, 2):
        res = h.walk_in(email=f"old{n}@test.com", method="UPI", utr_number="111122223333")
        assert res["success"], res
    assert all(not p.get("txn_ref") for p in h.fake.tables["payments"])


@with_harness()
def test_a_registered_email_points_the_desk_at_the_existing_userid(h):
    first = h.walk_in()["participant"]["user_id"]
    res = h.walk_in()
    assert not res["success"] and res["error_code"] == "DUPLICATE_EMAIL"
    assert res["user_id"] == first, "the desk needs the UserID to carry on with that person"
    assert len(h.fake.tables["participants"]) == 1 and len(h.emails) == 1


@with_harness()
def test_a_failed_payment_insert_leaves_no_orphan_participant(h):
    h.fake.fail_next_insert["payments"] = True
    try:
        h.walk_in()
        raise AssertionError("the payment failure must surface")
    except Zin26Error:
        pass
    assert not h.fake.tables["participants"], "an approved participant with no payment row must not survive"
    assert not h.emails


@with_harness()
def test_missing_details_and_payment_method_are_validated(h):
    assert h.walk_in(name="")["field"] == "name"
    assert h.walk_in(phone="12345")["field"] == "phone"
    assert h.walk_in(method="CHEQUE")["field"] == "payment_method"
    assert not h.fake.tables["participants"]


# ==============================================================================
# The close date: lifted for the desk only
# ==============================================================================

@with_harness()
def test_desk_registers_an_individual_event_after_the_website_has_closed(h):
    uid = h.walk_in()["participant"]["user_id"]
    res = spot.register_event(uid, "DEBUGGING")
    assert res["success"], res
    row = h.fake.select_one("registrations", f"user_id=eq.{uid}&event_code=eq.DEBUGGING")
    assert row["source"] == "SPOT" and row["status"] == "CONFIRMED"


@with_harness()
def test_the_website_stays_closed_on_the_same_day(h):
    uid = h.walk_in()["participant"]["user_id"]
    res = regs.register_individual(uid, "DEBUGGING")
    assert not res["success"] and res["error_code"] == "REGISTRATION_CLOSED", res
    assert not h.fake.tables["registrations"]


@with_harness(WEBSITE_OPEN)
def test_before_the_close_the_desk_uses_the_locking_function_with_source_spot(h):
    uid = h.walk_in()["participant"]["user_id"]
    calls = []
    original = regs.rpc_register
    regs.rpc_register = lambda *a, **k: (calls.append(k), original(*a, **k))[1]
    try:
        assert spot.register_event(uid, "LAST_SIGNAL")["success"]
    finally:
        regs.rpc_register = original
    assert calls and calls[0].get("source") == "SPOT"


@with_harness()
def test_short_film_stays_closed_even_at_the_desk(h):
    uid = h.walk_in()["participant"]["user_id"]
    assert spot.register_event(uid, "DEBUGGING")["success"]
    res = spot.register_event(uid, "SHORT_FILM")
    assert not res["success"] and res["error_code"] == "REGISTRATION_CLOSED", res


@with_harness()
def test_an_event_closed_on_the_events_page_is_closed_at_the_desk(h):
    uid = h.walk_in()["participant"]["user_id"]
    h.fake.update("events", "code=eq.DEBUGGING", {"is_active": False})
    res = spot.register_event(uid, "DEBUGGING")
    assert not res["success"] and res["error_code"] == "EVENT_INACTIVE", res

    detail = spot.person_detail(uid)
    card = next(c for c in detail["catalog"] if c["event_code"] == "DEBUGGING")
    assert card["state"] == "BLOCKED", card


@with_harness()
def test_the_three_event_cap_and_clashes_still_apply(h):
    uid = h.walk_in()["participant"]["user_id"]
    assert spot.register_event(uid, "LAST_SIGNAL")["success"]
    res = spot.register_event(uid, "LAST_SIGNAL")
    assert not res["success"] and res["error_code"] == "ALREADY_REGISTERED"

    # Gadget Codes runs all day: nothing on campus combines with it (R2).
    for code in ("GADGET_CODES",):
        res = spot.create_team(code, "Solo attempt", [uid, h.walk_in(email="mate@test.com")["participant"]["user_id"]])
        assert not res["success"] and res["error_code"] == "GADGET_CODES_EXCLUSIVE", res


@with_harness()
def test_team_events_cannot_be_registered_individually(h):
    uid = h.walk_in()["participant"]["user_id"]
    res = spot.register_event(uid, "BORDERLAND")
    assert not res["success"] and res["error_code"] == "TEAM_EVENT", res


# ==============================================================================
# Teams
# ==============================================================================

def _three(h):
    return [h.walk_in(email=f"m{i}@test.com")["participant"]["user_id"] for i in range(3)]


@with_harness()
def test_a_desk_team_is_confirmed_with_every_member_accepted(h):
    ids = _three(h)
    res = spot.create_team("BORDERLAND", "Walkers", ids)
    assert res["success"], res
    team = res["team"]
    assert team["status"] == "CONFIRMED" and team["captain_user_id"] == ids[0]
    assert all(m["accept_status"] == "ACCEPTED" for m in team["members"]), team["members"]

    rows = h.fake.select("registrations", f"team_id=eq.{team['team_id']}")
    assert len(rows) == 3 and all(r["status"] == "CONFIRMED" and r["source"] == "SPOT" for r in rows)


def test_every_event_keeps_its_team_size_and_non_tech_teams_are_two_or_three():
    sizes = {c: (e.min_team, e.max_team) for c, e in rules.EVENTS.items()}
    assert sizes == {
        "BORDERLAND": (2, 3), "THINK_STRIKE_WIN": (2, 3), "PLOT_TWIST": (2, 3), "SHORT_FILM": (1, 1),
        "PAPER_PRESENTATION": (2, 3), "GADGET_CODES": (2, 2),
        "DEBUGGING": (1, 1), "LAST_SIGNAL": (1, 1), "LOST_IN_SQL": (1, 1),
    }, sizes


@with_harness()
def test_non_tech_teams_of_two_and_three_register_and_one_or_four_do_not(h):
    for event in ("BORDERLAND", "THINK_STRIKE_WIN", "PLOT_TWIST"):
        # Fresh walk-ins per event: all three share the 2:00-3:00 slot.
        ids = [h.walk_in(email=f"{event.lower()}{i}@test.com")["participant"]["user_id"] for i in range(9)]
        for size in (1, 4):
            before = len(h.fake.tables["registrations"])
            res = spot.create_team(event, f"Size {size}", ids[:size])
            assert not res["success"] and res["error_code"] == "TEAM_SIZE", (event, size, res)
            assert len(h.fake.tables["registrations"]) == before, "a refused team writes nothing"
        pair = spot.create_team(event, "Pair", ids[4:6])
        assert pair["success"], (event, pair)
        trio = spot.create_team(event, "Trio", ids[6:9])
        assert trio["success"], (event, trio)
        live = [r for r in h.fake.tables["registrations"] if r["event_code"] == event and r["status"] == "CONFIRMED"]
        assert len(live) == 5, (event, live)
    solo = spot.create_team("SHORT_FILM", "Film", [h.walk_in(email="film@test.com")["participant"]["user_id"]] * 2)
    assert not solo["success"] and solo["error_code"] == "NOT_A_TEAM_EVENT", "Short Film stays individual"


def test_individual_event_tabs_carry_no_team_columns():
    from services import export_service as ex
    solo = [label for _, label in ex._event_columns("DEBUGGING")]
    assert solo == ["UserID", "Name", "Email", "Phone", "College", "Food", "Payment"], solo
    for code in ("LAST_SIGNAL", "LOST_IN_SQL", "SHORT_FILM"):
        assert ex._event_columns(code) == ex.EVENT_COLUMNS_INDIVIDUAL, code
    team = [label for _, label in ex._event_columns("BORDERLAND")]
    assert team[:2] == ["Team", "Team status"] and team[-2:] == ["Role", "Accepted"], team
    assert "Topic" in [label for _, label in ex._event_columns("PAPER_PRESENTATION")]
    assert ex._event_columns("GADGET_CODES") == ex.EVENT_COLUMNS


@with_harness()
def test_team_size_and_paper_verse_topic_are_enforced(h):
    ids = _three(h)
    res = spot.create_team("BORDERLAND", "Too small", ids[:1])
    assert not res["success"] and res["error_code"] == "TEAM_SIZE" and "2-3" in res["message"], res

    res = spot.create_team("PAPER_PRESENTATION", "Papers", ids[:2])
    assert not res["success"] and res["field"] == "topic", res

    res = spot.create_team("PAPER_PRESENTATION", "Papers", ids[:2], topic="Edge AI")
    assert res["success"], res
    assert h.fake.tables["teams"][0].get("topic") == "Edge AI"
    assert not h.fake.tables["teams"] or h.fake.tables["teams"][-1]["status"] == "CONFIRMED"


@with_harness()
def test_a_team_that_fails_halfway_is_removed_entirely(h):
    ids = _three(h)
    original = spot._claim_seat
    calls = {"n": 0}

    def flaky(uid, code, team_id=None):
        calls["n"] += 1
        if calls["n"] == 2:
            raise Zin26Error("simulated network failure")
        return original(uid, code, team_id=team_id)

    spot._claim_seat = flaky
    try:
        spot.create_team("BORDERLAND", "Half built", ids)
        raise AssertionError("the failure must surface")
    except Zin26Error:
        pass
    finally:
        spot._claim_seat = original

    assert not h.fake.tables["teams"] and not h.fake.tables["team_members"]
    assert not h.fake.tables["registrations"], "no member may keep a seat on a team that does not exist"


@with_harness()
def test_capacity_holds_after_the_close_and_a_team_seat_is_not_counted_twice(h):
    h.fake.update("events", "code=eq.PAPER_PRESENTATION", {"capacity": 1})
    ids = [h.walk_in(email=f"p{i}@test.com")["participant"]["user_id"] for i in range(4)]

    res = spot.create_team("PAPER_PRESENTATION", "First", ids[:3], topic="One")
    assert res["success"], "three members of one team take ONE seat"

    res = spot.create_team("PAPER_PRESENTATION", "Second", [ids[3], h.walk_in(email="p9@test.com")["participant"]["user_id"]], topic="Two")
    assert not res["success"] and res["error_code"] == "EVENT_FULL", res


# ==============================================================================
# Undo
# ==============================================================================

@with_harness()
def test_desk_can_remove_an_event_after_the_close(h):
    uid = h.walk_in()["participant"]["user_id"]
    assert spot.register_event(uid, "DEBUGGING")["success"]
    res = spot.cancel_event(uid, "DEBUGGING")
    assert res["success"], res
    assert not h.fake.select("registrations", f"user_id=eq.{uid}&status=neq.CANCELLED")
    assert spot.register_event(uid, "DEBUGGING")["success"], "a removed event can be registered again"


@with_harness()
def test_only_the_captain_record_cancels_a_team(h):
    ids = _three(h)
    assert spot.create_team("BORDERLAND", "Walkers", ids)["success"]
    res = spot.cancel_event(ids[1], "BORDERLAND")
    assert not res["success"] and res["error_code"] == "NOT_CAPTAIN" and res["captain_user_id"] == ids[0]
    assert spot.cancel_event(ids[0], "BORDERLAND")["success"]
    assert not h.fake.select("registrations", "status=neq.CANCELLED")


# ==============================================================================
# Search and the treasurer's queue
# ==============================================================================

@with_harness()
def test_search_finds_by_userid_email_phone_and_name(h):
    uid = h.walk_in(name="Kavya Raman", email="kavya@test.com", phone="9123456789")["participant"]["user_id"]
    for q in (uid, "kavya@test.com", "+91 91234 56789", "avya ram"):
        res = spot.search(q)
        assert res["success"] and [r["user_id"] for r in res["results"]] == [uid], (q, res)
    assert not spot.search("ab")["success"]


@with_harness()
def test_queue_files_desk_payments_as_approved_with_only_the_on_spot_flag(h):
    cash = h.walk_in(email="cash@test.com")["participant"]["user_id"]
    upi = h.walk_in(email="upi@test.com", method="UPI")["participant"]["user_id"]

    q = panel.payments_queue(status="APPROVED", page_size=500)
    got = {r["user_id"]: r for r in q["payments"]}
    assert cash in got, "a cash desk payment has no reference but is paid - it must not sit under Not paid"
    assert upi in got
    assert got[cash]["flags"] == ["ON_SPOT"], got[cash]["flags"]
    assert got[upi]["flags"] == ["ON_SPOT"], got[upi]["flags"]
    assert q["counts"]["APPROVED"] == 2 and q["counts"]["UNPAID"] == 0, q["counts"]


@with_harness()
def test_the_payment_drawer_lists_a_remade_teams_event_once(h):
    # A team cancelled and made again (migration 013) leaves a CANCELLED row
    # beside the live one; the drawer must not count it.
    uid = h.walk_in(email="remade@test.com")["participant"]["user_id"]
    h.fake.tables["registrations"] += [
        {"reg_id": 9001, "user_id": uid, "event_code": "PAPER_PRESENTATION", "team_id": "ZIN26-PP0001",
         "status": "CANCELLED", "source": "ONLINE", "created_at": "2026-09-19T14:08:00+00:00"},
        {"reg_id": 9002, "user_id": uid, "event_code": "PAPER_PRESENTATION", "team_id": "ZIN26-PP0002",
         "status": "CONFIRMED", "source": "ONLINE", "created_at": "2026-09-19T14:15:00+00:00"},
    ]
    d = panel.payment_detail(uid)
    assert d["success"], d
    assert d["payment"]["events_count"] == 1 and "," not in d["payment"]["event_list"], d["payment"]["event_list"]
    assert [r["reg_id"] for r in d["registrations"]] == [9002], d["registrations"]


def test_an_online_bypass_still_reads_as_bypassed():
    flags = panel._flags({}, {"amount": 250, "approval_note": "Paid in cash to the treasurer"}, True, set())
    assert flags == ["BYPASSED"], flags
    desk = "ON-SPOT | Cash | collected by Desk Treasurer"
    flags = panel._flags({}, {"amount": 300, "approval_note": desk}, False, set())
    assert flags == ["ON_SPOT"], flags
    flags = panel._flags({}, {"amount": 250, "approval_note": desk}, False, set())
    assert "AMOUNT_MISMATCH" in flags, "a desk payment at the online fee is still a mismatch"

    # Typed Bypass reasons that merely look like the desk note stay BYPASSED.
    for reason in ("On-spot cash, desk 2", "on-spot UPI 123456789012", "ON-SPOT cash", "ON-SPOT | Cash"):
        flags = panel._flags({}, {"amount": 250, "approval_note": reason}, True, set())
        assert flags == ["BYPASSED"], (reason, flags)


@with_harness()
def test_a_bypass_reason_cannot_be_stored_in_the_desk_note_shape(h):
    uid = participants.build_user_id(555)
    h.fake.insert("participants", {"user_id": uid, "name": "Online Person", "email": "online@test.com",
                                   "phone": "9000000000", "college": "X", "payment_status": "PENDING"})
    h.fake.insert("payments", {"user_id": uid, "amount": 250, "status": "PENDING", "txn_ref": "121212121212"})
    res = participants.treasurer_review_payment(user_id=uid, action="BYPASS",
                                                reason="ON-SPOT | Cash | collected by someone")
    assert res["success"], res
    pay = h.fake.tables["payments"][0]
    assert not spot.is_spot_note(pay["approval_note"]), pay["approval_note"]
    flags = panel._flags({}, pay, True, set())
    assert "BYPASSED" in flags and "ON_SPOT" not in flags, flags


# ==============================================================================
# The rule engine switch itself
# ==============================================================================

def test_ignore_close_date_lifts_r14_for_on_campus_events_only():
    after = real_dt.datetime.fromisoformat(WEBSITE_CLOSED)
    assert rules.can_register(payment_status="APPROVED", event_code="DEBUGGING", existing=[], now=after).code \
        == "REGISTRATION_CLOSED"
    assert rules.can_register(payment_status="APPROVED", event_code="DEBUGGING", existing=[], now=after,
                              ignore_close_date=True).ok
    assert rules.can_register(payment_status="APPROVED", event_code="SHORT_FILM", existing=["DEBUGGING"],
                              now=after, ignore_close_date=True).code == "REGISTRATION_CLOSED"
    assert rules.can_cancel(event_code="DEBUGGING", existing=["DEBUGGING"], now=after).code == "CANCELLATION_CLOSED"
    assert rules.can_cancel(event_code="DEBUGGING", existing=["DEBUGGING"], now=after, ignore_close_date=True).ok


# ==============================================================================
# 7:30 PM on 23 September: the website closes, the desk does not
# ==============================================================================

AFTER_CLOSE = "2026-09-23T20:00:00+05:30"   # after the online close, still the night before the fest
BEFORE_CLOSE = "2026-09-23T19:29:00+05:30"
ON_CAMPUS_SOLO = ("DEBUGGING", "LAST_SIGNAL", "LOST_IN_SQL")
ON_CAMPUS_TEAMS = {"GADGET_CODES": 2, "PAPER_PRESENTATION": 3, "BORDERLAND": 3, "THINK_STRIKE_WIN": 2, "PLOT_TWIST": 3}


def test_online_registration_closes_at_7_30_pm_ist_on_the_23rd():
    closes = real_dt.datetime.fromisoformat(rules._CLOSES_DEFAULT)
    assert closes == real_dt.datetime.fromisoformat("2026-09-23T19:30:00+05:30"), rules._CLOSES_DEFAULT
    on_campus = [c for c in rules.EVENTS if c != "SHORT_FILM"]
    assert all(rules.EVENTS[c].reg_closes_at == rules._CLOSES_DEFAULT for c in on_campus)
    for code in on_campus:
        before = rules.can_register(payment_status="APPROVED", event_code=code, existing=[],
                                    now=real_dt.datetime.fromisoformat(BEFORE_CLOSE))
        after = rules.can_register(payment_status="APPROVED", event_code=code, existing=[],
                                   now=real_dt.datetime.fromisoformat(AFTER_CLOSE))
        assert before.code != "REGISTRATION_CLOSED", (code, before.code)
        assert after.code == "REGISTRATION_CLOSED", (code, after.code)


@with_harness(BEFORE_CLOSE)
def test_the_website_still_registers_just_before_the_close(h):
    uid = h.walk_in()["participant"]["user_id"]
    res = regs.register_individual(uid, "DEBUGGING")
    assert res["success"], res


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_website_refuses_every_on_campus_event(h):
    from services import team_service

    uid = h.walk_in()["participant"]["user_id"]
    for code in ON_CAMPUS_SOLO:
        res = regs.register_individual(uid, code)
        assert not res["success"] and res["error_code"] == "REGISTRATION_CLOSED", (code, res)
    mates = [h.walk_in(email=f"web{i}@test.com")["participant"]["user_id"] for i in range(2)]
    for code, size in ON_CAMPUS_TEAMS.items():
        res = team_service.create_team(uid, code, "Late", mates[:size - 1], topic="Late topic")
        assert not res["success"] and res["error_code"] == "REGISTRATION_CLOSED", (code, res)
    assert not h.fake.tables["registrations"] and not h.fake.tables["teams"]


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_registers_every_individual_on_campus_event(h):
    for code in ON_CAMPUS_SOLO:
        uid = h.walk_in(email=f"{code.lower()}@test.com")["participant"]["user_id"]
        res = spot.register_event(uid, code)
        assert res["success"], (code, res)
        row = h.fake.select_one("registrations", f"user_id=eq.{uid}&event_code=eq.{code}")
        assert row and row["status"] == "CONFIRMED" and row["source"] == "SPOT", (code, row)


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_makes_a_team_for_every_team_event(h):
    for code, size in ON_CAMPUS_TEAMS.items():
        ids = [h.walk_in(email=f"{code.lower()}{i}@test.com")["participant"]["user_id"] for i in range(size)]
        res = spot.create_team(code, f"{code} desk team", ids, topic="Desk topic")
        assert res["success"], (code, res)
        team = res["team"]
        assert team["status"] == "CONFIRMED", (code, team)
        rows = h.fake.select("registrations", f"team_id=eq.{team['team_id']}")
        assert len(rows) == size and all(r["status"] == "CONFIRMED" and r["source"] == "SPOT" for r in rows), (code, rows)


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_sees_every_on_campus_event_open(h):
    uid = h.walk_in()["participant"]["user_id"]
    detail = spot.person_detail(uid)
    closed = [c["event_code"] for c in detail["catalog"]
              if c["event_code"] != "SHORT_FILM" and "clos" in str(c.get("reason") or c.get("blocked_reason") or "").lower()]
    assert not closed, f"the desk shows these as closed: {closed}"
    for code in ON_CAMPUS_SOLO:
        check = spot.check_member(uid, code)
        assert check["success"] and check["blocked_reason"] is None, (code, check)


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_never_depends_on_how_the_database_words_its_refusal(h):
    # Whatever the live function says once it has closed - even an error this
    # code has never seen - the desk does not ask it: it writes its own seat.
    calls = []

    def refuses_in_new_words(*a, **k):
        calls.append(a)
        raise Zin26Error("register failed: ZIN26_REGISTRATION_CLOSED", status=500, code="DB_ERROR")

    original = regs.rpc_register
    regs.rpc_register = refuses_in_new_words
    try:
        uid = h.walk_in()["participant"]["user_id"]
        assert spot.register_event(uid, "LOST_IN_SQL")["success"]
        ids = [h.walk_in(email=f"late{i}@test.com")["participant"]["user_id"] for i in range(2)]
        assert spot.create_team("PLOT_TWIST", "Late pair", ids)["success"]
    finally:
        regs.rpc_register = original
    assert not calls, "the closed function was still asked"


@with_harness(BEFORE_CLOSE)
def test_before_the_online_close_the_desk_still_uses_the_locking_function(h):
    calls = []
    original = regs.rpc_register
    regs.rpc_register = lambda *a, **k: (calls.append(k), original(*a, **k))[1]
    try:
        uid = h.walk_in()["participant"]["user_id"]
        assert spot.register_event(uid, "LOST_IN_SQL")["success"]
    finally:
        regs.rpc_register = original
    assert calls and calls[0].get("source") == "SPOT"


def _website_form(email="walk.up@test.com"):
    return {"name": "Walk Up", "email": email, "phone": "9812345678", "college": "GCEE",
            "department": "CSE", "year": "III", "food_preference": "VEG"}


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_website_takes_no_new_registration_at_all(h):
    res = participants.register_participant(_website_form())
    assert not res["success"] and res["error_code"] == "REGISTRATION_CLOSED", res
    assert "on-spot desk" in res["message"], res
    assert not h.fake.tables["participants"], "a refused registration wrote a row"


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_still_registers_a_walk_in(h):
    res = h.walk_in(email="after.nine@test.com")
    assert res["success"], res
    assert res["participant"]["payment_status"] == "APPROVED", res


@with_harness(BEFORE_CLOSE)
def test_before_the_online_close_the_website_form_is_not_refused_for_being_late(h):
    try:
        res = participants.register_participant(_website_form(email="early.bird@test.com"))
    except Exception:
        return   # it got past the close and failed later (mail is blocked in tests)
    assert res.get("error_code") != "REGISTRATION_CLOSED", res


@with_harness(AFTER_CLOSE)
def test_after_the_online_close_the_desk_can_still_remove_and_replace_an_event(h):
    uid = h.walk_in()["participant"]["user_id"]
    assert spot.register_event(uid, "DEBUGGING")["success"]
    res = spot.cancel_event(uid, "DEBUGGING", ADMIN)
    assert res["success"], res
    assert spot.register_event(uid, "LAST_SIGNAL")["success"]


# ==============================================================================
# Routes: TREASURER only
# ==============================================================================

def test_every_desk_route_admits_treasurers_and_desk_logins_only():
    from flask import Flask

    from middleware.auth_middleware import generate_admin_token
    from routes.admin_routes import admin_bp
    from services.participant_auth_service import generate_participant_token

    app = Flask(__name__)
    app.register_blueprint(admin_bp)
    client = app.test_client()

    saved = spot.search
    spot.search = lambda q, admin=None: {"success": True, "results": []}
    try:
        url = "/api/admin/spot/search?q=abc"
        assert client.get(url).status_code == 401, "no token"

        participant_token, _ = generate_participant_token("ZIN26-1010")
        r = client.get(url, headers={"Authorization": f"Bearer {participant_token}"})
        assert r.status_code == 401, f"a participant session is not an admin at all ({r.status_code})"

        for role, expected in (("GATE_ADMIN", 403), ("EVENT_COORDINATOR", 403), ("TREASURER", 200),
                               ("SUPER_ADMIN", 200), ("SPOT_DESK", 200)):
            token = generate_admin_token({"id": "x", "username": role.lower(), "role": role, "name": role})
            r = client.get(url, headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == expected, f"{role}: expected {expected}, got {r.status_code}"
    finally:
        spot.search = saved

    rules_by_path = {rule.rule: rule for rule in app.url_map.iter_rules()}
    for path in (
        "/api/admin/spot/participants",
        "/api/admin/spot/search",
        "/api/admin/spot/participants/<user_id>",
        "/api/admin/spot/participants/<user_id>/send-pass",
        "/api/admin/spot/check-member",
        "/api/admin/spot/events/register",
        "/api/admin/spot/events/cancel",
        "/api/admin/spot/teams",
        "/api/admin/spot/payee",
        "/api/admin/spot/check-email",
    ):
        assert path in rules_by_path, f"missing route {path}"


# ==============================================================================
# Review fixes
# ==============================================================================

class _Upload:
    filename = "proof.png"
    mimetype = "image/png"

    def read(self):
        return b"fake png bytes"


@with_harness()
def test_the_website_cannot_overwrite_a_desk_cash_payment(h):
    """
    Someone verifies their email on the website, walks to the desk and pays
    cash, then submits a UTR from the still-open website tab. The desk's
    APPROVED cash payment has no txn_ref, which promote_pending used to read as
    an unfinished online attempt and "finish" by overwriting it.
    """
    from services import pending_registration as pending

    details = {"name": "Walk In", "email": "walk.in@test.com", "phone": "9876543210", "college": "GCEE",
               "department": "CSE", "year": "III", "food_preference": "VEG"}
    token = pending.mint_verified(details)
    uid = h.walk_in()["participant"]["user_id"]
    before_pay = dict(h.fake.tables["payments"][0])

    res = participants.submit_payment({"registration_id": token, "utr_number": "444455556666"}, _Upload())
    assert not res["success"] and res["error_code"] == "DUPLICATE_EMAIL", res

    assert h.fake.tables["payments"] == [before_pay], "the approved desk payment must be untouched"
    assert h.fake.select_one("participants", f"user_id=eq.{uid}")["payment_status"] == "APPROVED"
    assert not h.fake.tables["login_otps"], "a refused submission writes nothing"


@with_harness()
def test_an_approved_payment_is_never_resubmitted_over(h):
    uid = h.walk_in(method="UPI")["participant"]["user_id"]
    # Verified, so the request gets past the email check to the approval guard.
    h.fake.insert("login_otps", {"user_id": uid, "otp_hash": "x", "consumed_at": "2026-09-24T10:00:00+00:00"})
    before = [dict(r) for r in h.fake.tables["payments"]]

    res = participants.submit_payment({"user_id": uid, "utr_number": "123412341234"}, _Upload())
    assert not res["success"] and res["error_code"] == "ALREADY_APPROVED", res
    assert h.fake.tables["payments"] == before


@with_harness()
def test_a_database_timeout_on_the_participant_insert_leaves_nothing_behind(h):
    h.fake.fail_next_insert["participants"] = requests.exceptions.ReadTimeout("simulated")
    try:
        h.walk_in()
        raise AssertionError("the timeout must surface")
    except Zin26Error as e:
        assert e.code == "DB_TIMEOUT" and "Search for" in e.message, e.message
    assert not h.fake.tables["participants"] and not h.fake.tables["payments"] and not h.emails


@with_harness()
def test_the_participant_is_approved_only_by_the_last_write(h):
    h.fake.fail_next_update["participants"] = True
    try:
        h.walk_in()
        raise AssertionError("the failure must surface")
    except Zin26Error:
        pass
    assert not h.fake.tables["participants"], "rolled back"
    assert not h.fake.tables["payments"], "the cascade takes the payment with it"
    assert not h.emails, "no pass for a registration that did not complete"


@with_harness()
def test_two_desks_racing_for_the_last_seat_leave_exactly_one(h):
    h.fake.update("events", "code=eq.PAPER_PRESENTATION", {"capacity": 1})
    uid = h.walk_in()["participant"]["user_id"]
    other = h.walk_in(email="other@test.com")["participant"]["user_id"]

    # The other desk's team landed after this desk read "1 seat left".
    h.fake.insert("registrations", {"user_id": other, "event_code": "PAPER_PRESENTATION",
                                    "team_id": "ZIN26-PP0001", "status": "CONFIRMED", "source": "SPOT"})
    stale = spot._remaining_seats
    spot._remaining_seats = lambda event: 1
    try:
        spot._claim_seat(uid, "PAPER_PRESENTATION", team_id="ZIN26-PP0002")
        raise AssertionError("the later claim must back out")
    except Zin26Error as e:
        assert e.code == "EVENT_FULL", e.code
    finally:
        spot._remaining_seats = stale

    live = h.fake.select("registrations", "event_code=eq.PAPER_PRESENTATION&status=neq.CANCELLED")
    assert [r["team_id"] for r in live] == ["ZIN26-PP0001"], live


@with_harness()
def test_capacity_is_counted_per_event_not_from_the_whole_table(h):
    calls = []
    original = h.fake.select

    def spy(table, query="select=*"):
        calls.append((table, query))
        return original(table, query)

    db.select = spy
    h.fake.update("events", "code=eq.PAPER_PRESENTATION", {"capacity": 30})
    ids = [h.walk_in(email=f"c{i}@test.com")["participant"]["user_id"] for i in range(2)]
    assert spot.create_team("PAPER_PRESENTATION", "Scoped", ids, topic="T")["success"]
    spot.person_detail(ids[0])
    unscoped = [q for t, q in calls if t == "registrations"
                and not any(k in q for k in ("event_code=eq.", "user_id=eq.", "team_id=eq."))]
    assert not unscoped, f"a whole-table registrations read is subject to the row cap: {unscoped}"


@with_harness()
def test_cancelling_a_team_checks_every_members_short_film(h):
    ids = _three(h)
    assert spot.create_team("BORDERLAND", "Walkers", ids)["success"]
    # Member 2 also holds Short Film, and Borderland is their only on-campus event.
    h.fake.insert("registrations", {"user_id": ids[1], "event_code": "SHORT_FILM", "status": "CONFIRMED"})

    res = spot.cancel_event(ids[0], "BORDERLAND")
    assert not res["success"] and res["error_code"] == "WOULD_ORPHAN_ONLINE_EVENT", res
    assert res["user_id"] == ids[1] and ids[1] in res["message"], res
    assert len(h.fake.select("registrations", "event_code=eq.BORDERLAND&status=neq.CANCELLED")) == 3


def test_the_desk_pass_email_does_not_send_walk_ins_to_the_closed_website():
    online = email_service.generate_master_qr_email_html("A", "ZIN26-1010", "https://x/login", "https://wa")
    desk = email_service.generate_master_qr_email_html("A", "ZIN26-1010", "https://x/login", "https://wa",
                                                       on_spot=True)
    assert "PICK YOUR EVENTS" in online and "catalog stays open" in online
    assert "PICK YOUR EVENTS" not in desk and "catalog stays open" not in desk
    assert "on-spot registration desk" in desk


# ==============================================================================
# The desk's own UPI accounts, and the early email check
# ==============================================================================

@with_harness()
def test_a_desk_login_always_gets_its_own_account_and_it_is_recorded(h):
    for n, (admin, key, upi) in enumerate(((ONSPOT1, "D1", "desk1@upi"), (ONSPOT2, "D2", "desk2@upi")), 1):
        payee = spot.desk_payee(admin)
        assert payee["success"] and payee["fixed"], payee
        assert [(a["key"], a["label"], a["upi_id"]) for a in payee["accounts"]] == [(key, f"Desk {n}", upi)]
        res = h.walk_in(email=f"own{n}@test.com", method="UPI", admin=admin, payee_key=key)
        assert res["success"], res
        pay = h.fake.select_one("payments", f"user_id=eq.{res['participant']['user_id']}")
        assert pay["payee_upi"] == upi, pay
        assert pay["approval_note"] == f"ON-SPOT | UPI | collected by {admin['name']}", pay["approval_note"]


@with_harness()
def test_a_desk_login_cannot_take_upi_into_the_other_desk_account(h):
    res = h.walk_in(method="UPI", admin=ONSPOT1, payee_key="D2")
    assert not res["success"] and res["field"] == "payment_method", res
    assert not h.fake.tables["participants"] and not h.fake.tables["payments"], "refused before any write"


@with_harness()
def test_a_treasurer_picks_either_desk_account_and_the_choice_is_recorded(h):
    payee = spot.desk_payee(ADMIN)
    assert payee["success"] and not payee["fixed"], payee
    assert [a["key"] for a in payee["accounts"]] == ["D1", "D2"]
    for n, key in enumerate(("D2", "D1"), 1):
        res = h.walk_in(email=f"pick{n}@test.com", method="UPI", payee_key=key)
        pay = h.fake.select_one("payments", f"user_id=eq.{res['participant']['user_id']}")
        assert pay["payee_upi"] == {"D1": "desk1@upi", "D2": "desk2@upi"}[key], pay


@with_harness()
def test_the_website_accounts_are_never_used_at_the_desk(h):
    offered = {a["upi_id"] for admin in (ADMIN, ONSPOT1, ONSPOT2) for a in spot.desk_payee(admin)["accounts"]}
    assert "website@upi" not in offered, offered

    for key in ("A", "B", ""):  # the website's account keys, or none at all
        res = h.walk_in(email=f"web{key or 'none'}@test.com", method="UPI", payee_key=key)
        assert not res["success"] and res["field"] == "payment_method", res

    for k in ("SPOT_DESK_1_UPI_ID", "SPOT_DESK_2_UPI_ID"):
        os.environ.pop(k)
    res = spot.desk_payee(ADMIN)
    assert not res["success"] and res["error_code"] == "PAYEE_NOT_CONFIGURED", \
        "with no desk account set, the desk takes cash - it never falls back to the website's"
    assert not h.fake.tables["payments"]


@with_harness()
def test_desks_three_and_four_each_take_upi_into_their_own_account_only(h):
    extra = {"SPOT_DESK_3_UPI_ID": "desk3@upi", "SPOT_DESK_3_ADMIN": "onspot3",
             "SPOT_DESK_4_UPI_ID": "desk4@upi", "SPOT_DESK_4_ADMIN": "onspot4"}
    os.environ.update(extra)
    try:
        onspot3 = {"id": "33333333-3333-4333-8333-333333333333", "username": "onspot3",
                   "name": "On-spot Desk 3", "role": "SPOT_DESK"}
        onspot4 = {"id": "44444444-4444-4444-8444-444444444444", "username": "onspot4",
                   "name": "On-spot Desk 4", "role": "SPOT_DESK"}
        for admin, key, upi, label in ((onspot3, "D3", "desk3@upi", "Desk 3"), (onspot4, "D4", "desk4@upi", "Desk 4")):
            payee = spot.desk_payee(admin)
            assert payee["success"] and payee["fixed"], payee
            assert [(a["key"], a["label"], a["upi_id"]) for a in payee["accounts"]] == [(key, label, upi)], payee
            res = h.walk_in(email=f"{key}@test.com", method="UPI", admin=admin, payee_key=key)
            assert res["success"], res
            pay = h.fake.select_one("payments", f"user_id=eq.{res['participant']['user_id']}")
            assert pay["payee_upi"] == upi, pay
        refused = h.walk_in(email="cross@test.com", method="UPI", admin=onspot3, payee_key="D4")
        assert not refused["success"] and refused["field"] == "payment_method", "desk 3 cannot use desk 4's QR"
        assert not spot.desk_payee(ONSPOT1)["accounts"][0]["upi_id"] in ("desk3@upi", "desk4@upi")
        assert [a["key"] for a in spot.desk_payee(ADMIN)["accounts"]] == ["D1", "D2", "D3", "D4"], \
            "a treasurer or super admin can pick any of the four"
    finally:
        os.environ.update({k: "" for k in extra})  # back to blank; the harness restores the real env


@with_harness()
def test_a_desk_only_login_without_an_account_takes_cash_only(h):
    stray = {"id": "33333333-3333-4333-8333-333333333333", "username": "onspot3", "name": "Desk 3",
             "role": "SPOT_DESK"}
    res = spot.desk_payee(stray)
    assert not res["success"] and res["error_code"] == "PAYEE_NOT_CONFIGURED", res
    assert "onspot3" in res["message"]
    assert not h.walk_in(email="u@test.com", method="UPI", admin=stray)["success"]
    assert h.walk_in(email="c@test.com", method="CASH", admin=stray)["success"], "cash still works"


@with_harness()
def test_the_payments_bank_column_names_the_desk_account(h):
    assert panel._payee_bank("desk1@upi") == "Desk 1"
    assert panel._payee_bank("DESK2@UPI") == "Desk 2"
    assert panel._payee_bank("") == ""


def test_a_participant_session_token_opens_no_admin_route():
    """
    Participant sessions are signed with the same key, in the same format, as
    admin tokens. They must never pass as an admin - above all on the "any
    signed-in admin" routes, which include the full participant export.
    """
    from flask import Flask

    from routes.admin_routes import admin_bp
    from services.participant_auth_service import generate_participant_token

    app = Flask(__name__)
    app.register_blueprint(admin_bp)
    client = app.test_client()
    token, _ = generate_participant_token("ZIN26-1010")
    auth = {"Authorization": f"Bearer {token}"}
    for method, url in (
        ("GET", "/api/admin/me"),
        ("GET", "/api/admin/dashboard"),
        ("GET", "/api/admin/events"),
        ("POST", "/api/admin/export/preview"),
        ("POST", "/api/admin/export/workbook"),
        ("GET", "/api/admin/export/event/DEBUGGING"),
        ("GET", "/api/admin/stats"),
        ("GET", "/api/admin/spot/summary"),
        ("GET", "/api/admin/payments"),
    ):
        r = client.open(url, method=method, headers=auth)
        assert r.status_code == 401, f"{method} {url}: a participant token got {r.status_code}"


@with_harness()
def test_a_desk_login_searches_by_exact_identifiers_only(h):
    uid = h.walk_in(email="find.me@test.com")["participant"]["user_id"]
    for term in (uid, "find.me@test.com", "9876543210"):
        res = spot.search(term, ONSPOT1)
        assert res["success"] and [r["user_id"] for r in res["results"]] == [uid], (term, res)
    for term in ("Walk", "ZIN26-01", "find"):
        res = spot.search(term, ONSPOT1)
        assert not res["success"], f"{term!r} would let a desk login browse the directory"
        assert spot.search(term, ADMIN)["success"], "a treasurer keeps the full search"


@with_harness()
def test_a_desk_login_cannot_remove_an_online_registration(h):
    online = participants.build_user_id(561)
    h.fake.insert("participants", {"user_id": online, "name": "Online Three", "email": "online3@test.com",
                                   "phone": "9000000003", "college": "X", "payment_status": "APPROVED"})
    h.fake.insert("registrations", {"user_id": online, "event_code": "DEBUGGING", "team_id": None,
                                    "status": "CONFIRMED", "source": "ONLINE"})
    res = spot.cancel_event(online, "DEBUGGING", ONSPOT1)
    assert not res["success"] and res["error_code"] == "NOT_DESK_REGISTRATION", res

    uid = h.walk_in(email="desk.undo@test.com", admin=ONSPOT1)["participant"]["user_id"]
    assert spot.register_event(uid, "LAST_SIGNAL", confirm_warnings=True)["success"]
    assert spot.cancel_event(uid, "LAST_SIGNAL", ONSPOT1)["success"], "desk work stays undoable at the desk"


@with_harness()
def test_a_desk_slot_set_to_a_website_account_is_ignored(h):
    os.environ["SPOT_DESK_1_UPI_ID"] = "WEBSITE@upi"  # the website's account, in other capitals
    assert [a["key"] for a in spot.desk_upi_accounts()] == ["D2"]
    res = spot.desk_payee(ONSPOT1)
    assert not res["success"] and res["error_code"] == "PAYEE_NOT_CONFIGURED", res

    os.environ["SPOT_DESK_1_UPI_ID"] = "desk1@upi"
    os.environ["SPOT_DESK_2_UPI_ID"] = "DESK1@upi"  # the same account twice
    assert [a["key"] for a in spot.desk_upi_accounts()] == ["D1"]


@with_harness()
def test_each_desk_login_sees_its_own_till_and_everyone_the_same_capacity(h):
    h._patch(panel, "_desk_logins", lambda: [
        {"id": ONSPOT1["id"], "username": "onspot1", "name": ONSPOT1["name"]},
        {"id": ONSPOT2["id"], "username": "onspot2", "name": ONSPOT2["name"]},
    ])
    fee = spot.ON_SPOT_FEE
    a = h.walk_in(email="t1@test.com", admin=ONSPOT1)["participant"]["user_id"]                       # cash
    b = h.walk_in(email="t2@test.com", method="UPI", admin=ONSPOT1, payee_key="D1")["participant"]["user_id"]
    h.walk_in(email="t3@test.com", method="UPI", admin=ONSPOT2, payee_key="D2")
    h.walk_in(email="t4@test.com")                                                                   # treasurer, cash
    assert spot.register_event(a, "DEBUGGING", confirm_warnings=True)["success"]
    assert spot.register_event(b, "DEBUGGING", confirm_warnings=True)["success"]

    # An online team in Paper Verse: part of the capacity board, never desk money.
    online = participants.build_user_id(563)
    h.fake.insert("participants", {"user_id": online, "name": "Online Five", "email": "online5@test.com",
                                   "phone": "9000000005", "college": "X", "payment_status": "APPROVED"})
    h.fake.insert("payments", {"user_id": online, "amount": 250, "status": "APPROVED", "txn_ref": "989898989898"})
    h.fake.insert("teams", {"team_id": "ZIN26-PP0002", "event_code": "PAPER_PRESENTATION", "team_name": "Web2",
                            "captain_user_id": online, "status": "CONFIRMED"})
    h.fake.insert("registrations", {"user_id": online, "event_code": "PAPER_PRESENTATION",
                                    "team_id": "ZIN26-PP0002", "status": "CONFIRMED", "source": "ONLINE"})

    one = panel.spot_summary(ONSPOT1)["summary"]
    two = panel.spot_summary(ONSPOT2)["summary"]
    assert one["scope"] == two["scope"] == "MINE"
    assert "tills" not in one and "total" not in one, "a desk never sees the other desk's money"
    m1, m2 = one["me"], two["me"]
    assert (m1["participants"], m1["cash"], m1["upi"], m1["total"]) == (
        2, {"count": 1, "amount": fee}, {"count": 1, "amount": fee}, {"count": 2, "amount": 2 * fee}), m1
    assert m1["upi_account"] == {"label": "Desk 1", "upi_id": "desk1@upi"}
    assert (m2["participants"], m2["cash"]["amount"], m2["upi"]["amount"]) == (1, 0, fee), m2
    assert m2["upi_account"]["label"] == "Desk 2"

    assert one["capacity"] == two["capacity"], "both desks see the same capacity board"
    cap = {e["event_code"]: e for e in one["capacity"]}
    assert cap["DEBUGGING"]["used"] == 2 and cap["DEBUGGING"]["desk_used"] == 2
    pv = cap["PAPER_PRESENTATION"]
    assert (pv["used"], pv["capacity"], pv["remaining"], pv["desk_used"]) == (1, 30, 29, 0), pv

    everyone = panel.spot_summary(ADMIN)["summary"]
    assert everyone["scope"] == "ALL"
    tills = {t["name"]: (t["participants"], t["total"]["amount"]) for t in everyone["tills"]}
    assert tills == {"On-spot Desk 1": (2, 2 * fee), "On-spot Desk 2": (1, fee),
                     "Desk Treasurer": (1, fee)}, tills
    assert everyone["total"]["participants"] == 4 and everyone["total"]["total"]["amount"] == 4 * fee
    assert everyone["capacity"] == one["capacity"]


@with_harness()
def test_a_desk_slot_set_to_the_switched_off_third_website_account_is_still_ignored(h):
    os.environ["TREASURER_UPI_ID_3"] = "desk2@upi"
    os.environ["TREASURER_UPI_3_ENABLED"] = "false"
    try:
        assert [a["key"] for a in spot.desk_upi_accounts()] == ["D1"], "a website account, on or off"
    finally:
        os.environ.pop("TREASURER_UPI_ID_3", None)
        os.environ.pop("TREASURER_UPI_3_ENABLED", None)


# ==============================================================================
# The website's money path, end to end: the account shown is the account recorded
# ==============================================================================

WEBSITE_ACCOUNTS = {
    "TREASURER_UPI_ID": "acct.a@upi", "TREASURER_PAYEE_NAME": "Payee A", "TREASURER_BANK_LABEL": "SBI",
    "TREASURER_UPI_ID_2": "acct.b@upi", "TREASURER_PAYEE_NAME_2": "Payee B", "TREASURER_BANK_LABEL_2": "Union Bank",
    "TREASURER_UPI_ID_3": "acct.c@upi", "TREASURER_PAYEE_NAME_3": "Payee C", "TREASURER_BANK_LABEL_3": "SBI (C)",
}
LABELS = {"acct.a@upi": "SBI", "acct.b@upi": "Union Bank", "acct.c@upi": "SBI (C)"}


def _website_accounts(third_on: bool):
    """Three website accounts, the third switched on or off. Returns the undo."""
    keys = list(WEBSITE_ACCOUNTS) + ["TREASURER_UPI_3_ENABLED"]
    saved = {k: os.environ.get(k) for k in keys}
    os.environ.update(WEBSITE_ACCOUNTS)
    os.environ["TREASURER_UPI_3_ENABLED"] = "true" if third_on else "false"

    def undo():
        for k, v in saved.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v
    return undo


def _website_flow(h, email, n, tickets=None, pay=True):
    """
    Everything a participant does on the website: the details form, the
    emailed code, the payment screen, and submitting the payment. Returns the
    account shown at each step and the one the payment row was recorded with.
    """
    from services import drive_storage as drive
    from services import participant_auth_service as auth

    codes = []
    h._patch(auth, "send_pending_otp_email", lambda details, otp: codes.append(otp) or True)
    h._patch(drive, "is_configured", lambda: False)
    h._patch(db, "upload_file", lambda path, data, mime: f"payment-proofs/{path}")

    form = {"name": "Web Payer", "email": email, "phone": "9123456780", "college": "GCEE",
            "department": "CSE", "year": "II", "food_preference": "VEG"}
    if tickets is not None:
        form["payee_tickets"] = tickets
    reg = participants.register_participant(form)
    assert reg["success"], reg
    ver = auth.verify_registration_email(registration_id=reg["registration_id"], otp=codes[-1])
    assert ver["success"] and ver["payee_upi_id"], ver
    screen = participants.payment_status(registration_id=ver["registration_id"])
    out = {"verified": ver["payee_upi_id"], "screen": screen["payee_upi_id"], "ticket": ver["payee_ticket"],
           "recorded": None, "bank": None}
    if pay:
        res = participants.submit_payment(
            {"registration_id": ver["registration_id"], "utr_number": f"{510000000000 + n}"}, _Upload())
        assert res["success"], res
        row = h.fake.select_one("participants", f"email=eq.{email}")
        pay_row = h.fake.select_one("payments", f"user_id=eq.{row['user_id']}")
        out["recorded"] = pay_row["payee_upi"]
        out["bank"] = panel._payee_bank(pay_row["payee_upi"])
    return out


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_with_two_accounts_every_payment_is_recorded_against_the_qr_shown(h):
    undo = _website_accounts(third_on=False)
    try:
        used = set()
        for n in range(16):
            r = _website_flow(h, f"two{n}@test.com", n)
            assert r["verified"] == r["screen"] == r["recorded"], r
            assert r["bank"] == LABELS[r["recorded"]], r
            used.add(r["recorded"])
        assert used == {"acct.a@upi", "acct.b@upi"}, f"switched off, only A and B take money: {used}"
    finally:
        undo()


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_with_the_third_account_on_all_three_share_and_each_payment_matches_its_qr(h):
    undo = _website_accounts(third_on=True)
    try:
        used = {}
        for n in range(36):
            r = _website_flow(h, f"three{n}@test.com", 100 + n)
            assert r["verified"] == r["screen"] == r["recorded"], r
            assert r["bank"] == LABELS[r["recorded"]], r
            used[r["recorded"]] = used.get(r["recorded"], 0) + 1
        assert set(used) == {"acct.a@upi", "acct.b@upi", "acct.c@upi"}, f"all three take money: {used}"
    finally:
        undo()


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_switch_flipped_mid_registration_never_moves_the_account(h):
    """Given C, the switch goes off, the form is filled again: still C, and the payment is recorded to C."""
    from services import pending_registration as pending

    undo = _website_accounts(third_on=True)
    try:
        email = next(f"flip{n}@test.com" for n in range(200)
                     if pending.choose_payee(f"flip{n}@test.com") == "C")
        first = _website_flow(h, email, 900, pay=False)
        assert first["verified"] == "acct.c@upi"

        os.environ["TREASURER_UPI_3_ENABLED"] = "false"          # flipped mid-fest
        assert pending.choose_payee(email) != "C", "a fresh choice would move them off C"
        again = _website_flow(h, email, 901, tickets=[first["ticket"]])
        assert again["verified"] == again["screen"] == again["recorded"] == "acct.c@upi", again
        assert again["bank"] == "SBI (C)"
    finally:
        undo()


def _toggle_and_choose(email):
    """choose_payee with the third account's switch the other way round, then put back."""
    from services import pending_registration as pending
    before = os.environ.get("TREASURER_UPI_3_ENABLED", "false")
    os.environ["TREASURER_UPI_3_ENABLED"] = "false" if before == "true" else "true"
    try:
        return pending.choose_payee(email)
    finally:
        os.environ["TREASURER_UPI_3_ENABLED"] = before


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_two_tabs_and_a_resend_across_a_flip_keep_the_first_account(h):
    """Two tabs of the details form verified either side of a switch flip, then a resend: one account."""
    from services import participant_auth_service as auth
    from services import pending_registration as pending

    undo = _website_accounts(third_on=False)
    try:
        email = next(f"tabs{n}@test.com" for n in range(300)
                     if pending.choose_payee(f"tabs{n}@test.com") != _toggle_and_choose(f"tabs{n}@test.com"))
        codes = []
        h._patch(auth, "send_pending_otp_email", lambda details, otp: codes.append(otp) or True)
        form = {"name": "Two Tabs", "email": email, "phone": "9123456781", "college": "GCEE",
                "department": "CSE", "year": "II", "food_preference": "VEG"}
        tab1 = participants.register_participant(form)["registration_id"]
        code1 = codes[-1]
        tab2 = participants.register_participant(form)["registration_id"]
        code2 = codes[-1]

        first = auth.verify_registration_email(registration_id=tab1, otp=code1)
        os.environ["TREASURER_UPI_3_ENABLED"] = "true"                 # flipped between the two tabs
        second = auth.verify_registration_email(registration_id=tab2, otp=code2,
                                                payee_tickets=[first["payee_ticket"]])
        assert second["payee_upi_id"] == first["payee_upi_id"], (first["payee_upi_id"], second["payee_upi_id"])

        resent = auth.request_otp(registration_id=tab2, payee_tickets=[first["payee_ticket"]])
        third = auth.verify_registration_email(registration_id=resent["registration_id"], otp=codes[-1])
        assert third["payee_upi_id"] == first["payee_upi_id"], "a resend after the flip keeps it"
    finally:
        undo()


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_a_token_from_before_this_change_takes_the_ticket_at_verification(h):
    from services import participant_auth_service as auth
    from services import pending_registration as pending

    undo = _website_accounts(third_on=True)
    try:
        email = "legacy@test.com"
        other = "B" if pending.choose_payee(email) != "B" else "A"
        details = {"name": "Legacy", "email": email, "phone": "9123456782", "college": "GCEE",
                   "department": "CSE", "year": "II", "food_preference": "VEG"}
        old_token = pending.mint(details, "111222")                   # no account inside, as before
        res = auth.verify_registration_email(registration_id=old_token, otp="111222",
                                             payee_tickets=[pending.payee_ticket(email, other)])
        assert res["success"], res
        assert pending.payee_of(pending.open_token(res["registration_id"])[0]) == other
    finally:
        undo()


@with_harness(now_iso=WEBSITE_OPEN)
def test_website_submission_never_relabels_a_desk_payment_that_lands_mid_submission(h):
    """The desk approves the same email between the website's promote and its payment write."""
    from services import drive_storage as drive
    from services import pending_registration as pending

    undo = _website_accounts(third_on=False)
    try:
        details = {"name": "Race", "email": "race@test.com", "phone": "9123456783", "college": "GCEE",
                   "department": "CSE", "year": "II", "food_preference": "VEG"}
        verified = pending.mint_verified(details)
        real_promote = participants.promote_pending

        def promote_then_desk_lands(d, **kw):
            out = real_promote(d, **kw)
            h.fake.insert("payments", {"user_id": out["participant"]["user_id"], "amount": 300,
                                       "status": "APPROVED", "payee_upi": "desk1@upi",
                                       "approval_note": "ON-SPOT | UPI | collected by On-spot Desk 1"})
            return out

        h._patch(participants, "promote_pending", promote_then_desk_lands)
        h._patch(drive, "is_configured", lambda: False)
        h._patch(db, "upload_file", lambda path, data, mime: f"payment-proofs/{path}")
        res = participants.submit_payment({"registration_id": verified, "utr_number": "620000000001"}, _Upload())
        assert not res["success"] and res["error_code"] == "ALREADY_APPROVED", res
        approved = [p for p in h.fake.tables["payments"] if p.get("status") == "APPROVED"]
        assert approved and approved[0]["payee_upi"] == "desk1@upi", "the desk's account must stand"
    finally:
        undo()


def test_a_desk_login_reaches_the_desk_and_nothing_else():
    from flask import Flask

    from middleware.auth_middleware import generate_admin_token
    from routes.admin_routes import admin_bp

    app = Flask(__name__)
    app.register_blueprint(admin_bp)
    client = app.test_client()
    token = generate_admin_token({"id": "x", "username": "onspot1", "role": "SPOT_DESK", "name": "Desk 1"})
    auth = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/admin/me", headers=auth)
    assert me.status_code == 200 and me.get_json()["user"]["role"] == "SPOT_DESK", me.status_code

    for method, url in (
        ("GET", "/api/admin/dashboard"),
        ("GET", "/api/admin/events"),
        ("GET", "/api/admin/payments"),
        ("POST", "/api/admin/payments/ZIN26-0019/approve"),
        ("POST", "/api/admin/payments/ZIN26-0019/bypass"),
        ("POST", "/api/admin/export/workbook"),
        ("GET", "/api/admin/export/event/DEBUGGING"),
        ("GET", "/api/admin/stats"),
        ("GET", "/api/admin/settings"),
        ("GET", "/api/admin/audit"),
    ):
        r = client.open(url, method=method, headers=auth)
        assert r.status_code == 403, f"{method} {url}: a desk login got {r.status_code}"


@with_harness()
def test_the_email_check_finds_a_registered_address_whatever_its_case(h):
    uid = h.walk_in(email="taken@test.com")["participant"]["user_id"]
    hit = spot.check_email("  Taken@Test.COM ")
    assert hit["success"] and hit["registered"] and hit["user_id"] == uid, hit
    miss = spot.check_email("free@test.com")
    assert miss["success"] and not miss["registered"] and miss["user_id"] is None, miss
    bad = spot.check_email("not-an-email")
    assert not bad["success"] and bad["field"] == "email", bad


def test_the_payee_and_email_check_routes_are_treasurer_only():
    from flask import Flask

    from middleware.auth_middleware import generate_admin_token
    from routes.admin_routes import admin_bp

    app = Flask(__name__)
    app.register_blueprint(admin_bp)
    client = app.test_client()

    saved = (spot.desk_payee, spot.check_email)
    spot.desk_payee = lambda admin: {"success": True, "fixed": False, "accounts": []}
    spot.check_email = lambda email: {"success": True, "registered": False}
    try:
        for url in ("/api/admin/spot/payee", "/api/admin/spot/check-email?email=a%40b.co"):
            assert client.get(url).status_code == 401, f"{url}: no token"
            for role, expected in (("GATE_ADMIN", 403), ("EVENT_COORDINATOR", 403), ("TREASURER", 200),
                                   ("SPOT_DESK", 200)):
                token = generate_admin_token({"id": "x", "username": role.lower(), "role": role, "name": role})
                r = client.get(url, headers={"Authorization": f"Bearer {token}"})
                assert r.status_code == expected, f"{url} as {role}: expected {expected}, got {r.status_code}"
    finally:
        spot.desk_payee, spot.check_email = saved


# ==============================================================================
# The pass email is sent after the registration, not inside it
# ==============================================================================

@with_harness()
def test_a_deferred_walk_in_registers_without_waiting_on_the_mail_server(h):
    res = h.walk_in(defer_email=True)
    assert res["success"], res
    uid = res["participant"]["user_id"]
    assert res["email_sent"] is None and not h.emails, "the desk sends the pass itself, straight after"
    assert res["message"] == f"{uid} registered.", res["message"]
    assert h.fake.select_one("participants", f"user_id=eq.{uid}")["payment_status"] == "APPROVED"


@with_harness()
def test_send_pass_gives_a_walk_in_the_desk_wording_and_an_online_registrant_the_online_one(h):
    walk_in = h.walk_in(email="desk@test.com", defer_email=True)["participant"]["user_id"]
    res = spot.send_pass(walk_in)
    assert res["success"] and res["message"] == "Pass emailed to desk@test.com.", res

    online = participants.build_user_id(556)
    h.fake.insert("participants", {"user_id": online, "name": "Online Person", "email": "online@test.com",
                                   "phone": "9000000000", "college": "X", "payment_status": "APPROVED"})
    h.fake.insert("payments", {"user_id": online, "amount": 250, "status": "APPROVED", "txn_ref": "343434343434"})
    assert spot.send_pass(online.lower())["success"]

    assert h.emails == ["desk@test.com", "online@test.com"], h.emails
    assert h.pass_wording == [True, False], "only a desk payment gets the desk wording"
    sent = [a for (a, _k) in h.audit if a[0] == "SPOT_PASS_EMAIL"]
    assert [a[2] for a in sent] == [walk_in, online], sent


@with_harness()
def test_send_pass_refuses_without_an_approved_payment_and_reports_a_failed_send(h):
    unpaid = participants.build_user_id(557)
    h.fake.insert("participants", {"user_id": unpaid, "name": "Not Paid", "email": "unpaid@test.com",
                                   "phone": "9000000001", "college": "X", "payment_status": "PENDING"})
    res = spot.send_pass(unpaid)
    assert not res["success"] and res["error_code"] == "NOT_APPROVED", res
    assert not h.emails, "no pass before the payment is approved"

    assert spot.send_pass("ZIN26-NOPE")["error_code"] == "INVALID_USER_ID"
    assert spot.send_pass(participants.build_user_id(558))["error_code"] == "NOT_FOUND"

    uid = h.walk_in(defer_email=True)["participant"]["user_id"]
    h._patch(email_service, "send_master_qr_email", lambda participant, on_spot=False: {"success": False})
    res = spot.send_pass(uid)
    assert not res["success"] and res["error_code"] == "EMAIL_FAILED", res
    assert "could not be sent" in res["message"]


@with_harness()
def test_the_payments_page_resend_also_gives_a_walk_in_the_desk_wording(h):
    walk_in = h.walk_in(email="desk2@test.com", defer_email=True)["participant"]["user_id"]
    online = participants.build_user_id(560)
    h.fake.insert("participants", {"user_id": online, "name": "Online Two", "email": "online2@test.com",
                                   "phone": "9000000002", "college": "X", "payment_status": "APPROVED"})
    h.fake.insert("payments", {"user_id": online, "amount": 250, "status": "APPROVED", "txn_ref": "565656565656"})

    assert panel.resend_pass(walk_in)["success"] and panel.resend_pass(online)["success"]
    assert h.emails == ["desk2@test.com", "online2@test.com"], h.emails
    assert h.pass_wording == [True, False], h.pass_wording


@with_harness()
def test_opening_a_person_reads_the_same_record_with_the_reads_run_side_by_side(h):
    """person_detail now issues its reads in parallel; the answer must not change."""
    uid = h.walk_in(defer_email=True)["participant"]["user_id"]
    assert spot.register_event(uid, "DEBUGGING", confirm_warnings=True)["success"]
    detail = spot.person_detail(uid)
    assert detail["success"], detail
    assert detail["participant"]["user_id"] == uid
    assert [r["event_code"] for r in detail["registrations"]] == ["DEBUGGING"]
    assert detail["payment"]["is_spot"] and detail["payment"]["amount"] == spot.ON_SPOT_FEE
    assert detail["counted_used"] == 1
    assert "DEBUGGING" not in {c["event_code"] for c in detail["catalog"] if c["state"] == "AVAILABLE"}
    assert spot.person_detail(participants.build_user_id(559))["error_code"] == "NOT_FOUND"


def test_the_send_pass_route_exists_and_is_treasurer_only():
    from flask import Flask
    from middleware.auth_middleware import generate_admin_token
    from routes.admin_routes import admin_bp

    app = Flask(__name__)
    app.register_blueprint(admin_bp)
    client = app.test_client()
    url = "/api/admin/spot/participants/ZIN26-0019/send-pass"

    saved = spot.send_pass
    spot.send_pass = lambda uid: {"success": True, "sent": True, "message": "ok"}
    try:
        assert client.post(url).status_code == 401, "no token"
        for role, expected in (("GATE_ADMIN", 403), ("EVENT_COORDINATOR", 403), ("TREASURER", 200),
                               ("SPOT_DESK", 200)):
            token = generate_admin_token({"id": "x", "username": role.lower(), "role": role, "name": role})
            r = client.post(url, headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == expected, f"{role}: expected {expected}, got {r.status_code}"
    finally:
        spot.send_pass = saved


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
        except Exception as e:  # a broken test is a failure, not a crash
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
