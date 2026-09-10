"""
Zinnia 2026 — Admin Panel Service Layer (zin26, PostgREST only)

NO DATABASE MIGRATION REQUIRED.

An earlier version of this file read SQL views and functions (v_event_counts,
admin_dashboard, v_payment_queue). Creating those needs DDL, and the backend
speaks only PostgREST, which runs queries but not DDL — so the panel could not
be made to work without someone opening a SQL editor. Every screen below now
reads the tables that already exist and aggregates in Python instead.

The trade-off is honest: this fetches whole tables and joins them here rather
than in Postgres. At symposium scale — tens of events, hundreds to a couple of
thousand participants — that is a few hundred KB per request and imperceptible.
If the numbers ever grow past that, migration 009 recreates these as SQL views
and only this file changes.

Columns used are the ones zin26 already has:
    events        code, name, capacity, capacity_is_locked, is_active,
                  reg_closes_at, min_team, max_team, sort_order
    participants  user_id, name, email, phone, college, department, year,
                  food_preference, payment_status, master_qr_token, created_at
    payments      id, user_id, amount, txn_ref, status, reject_reason,
                  screenshot_url, created_at, approved_at
    registrations reg_id, user_id, event_code, team_id, status, created_at
    teams         team_id, event_code, team_name, captain_user_id, status
    team_members  team_id, user_id, role, accept_status, invited_at

`is_active` is the open/close switch. It is what the participant flow already
reads (event_registration_service.capacity_map), so closing an event here
genuinely closes it there — no second flag to keep in step.

Who closed an event and why is recorded in admin_audit_log rather than in new
columns on the events table, which is where that history belongs anyway.
"""

from __future__ import annotations

import datetime as dt
from collections import defaultdict
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, List, Optional

from flask import g

from services import zin26_db as db
from services.audit_service import log_action

QUEUE_PAGE_SIZE = 50
REGISTRATION_FEE = 250

# A seat is occupied unless the registration was cancelled. This mirrors
# event_registration_service.capacity_map() exactly — if the two ever disagree,
# the panel would show a different number from the one the participant site
# enforces, which is worse than either being wrong on its own.
LIVE_REG = "status=neq.CANCELLED"


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def _parse(value: Optional[str]) -> Optional[dt.datetime]:
    if not value:
        return None
    try:
        d = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except (ValueError, TypeError):
        return None


def _hours_since(value: Optional[str]) -> float:
    d = _parse(value)
    if not d:
        return 0.0
    return (dt.datetime.now(dt.timezone.utc) - d).total_seconds() / 3600


# ==============================================================================
# SHARED READS — one fetch each, reused across screens
# ==============================================================================
#
# "One fetch each" held per SCREEN but not per EXPORT. A workbook builds nine
# event rosters, and _event_roster_rows() re-read registrations, participants,
# teams and team_members for every one of them — 21 sequential PostgREST round
# trips with the tables empty, and about 45 once they are not. Measured at 75
# seconds against a live project, versus a 10-second Vercel function ceiling on
# Hobby and 60 on Pro. The Google Sheets sync runs unattended every few minutes,
# so it cannot be the thing that discovers this.
#
# cached_reads() memoises the shared tables for the duration of one build. It is
# OFF unless a caller opens the block, so every other screen keeps reading live
# and nothing outside the export path changes behaviour.
_snapshot: Optional[Dict[str, Any]] = None


@contextmanager
def cached_reads():
    """Fetch each shared table at most once for the duration of the block."""
    global _snapshot
    outer = _snapshot          # nesting is harmless: the inner block reuses
    _snapshot = {} if outer is None else outer
    try:
        yield
    finally:
        _snapshot = outer


def _cached(key: str, fetch):
    if _snapshot is None:
        return fetch()
    if key not in _snapshot:
        _snapshot[key] = fetch()
    return _snapshot[key]


def _events() -> List[Dict[str, Any]]:
    return _cached("events", lambda: db.select(
        "events",
        "select=code,name,capacity,capacity_is_locked,is_active,reg_closes_at,"
        "min_team,max_team,sort_order,category,type&order=sort_order",
    ))


def _registrations() -> List[Dict[str, Any]]:
    return _cached("registrations", lambda: db.select(
        "registrations", f"select=reg_id,user_id,event_code,team_id,status&{LIVE_REG}"))


def _teams() -> List[Dict[str, Any]]:
    return _cached("teams", lambda: db.select(
        "teams", "select=team_id,event_code,team_name,captain_user_id,status,created_at"))


def _team_members() -> List[Dict[str, Any]]:
    """Shared by the event rosters and the Teams sheet, which both re-read it."""
    return _cached("team_members", lambda: db.select(
        "team_members", "select=team_id,user_id,role,accept_status"))


def _participants() -> List[Dict[str, Any]]:
    return _cached("participants", lambda: db.select(
        "participants",
        "select=user_id,name,email,phone,college,department,year,food_preference,"
        "payment_status,master_qr_token,created_at",
    ))


def _latest_payments() -> Dict[str, Dict[str, Any]]:
    """
    Newest attempt per participant, plus how many attempts there have been.

    A resubmission appends a payments row rather than overwriting one, because
    the treasurer needs the history — so without collapsing to the latest, a
    participant who paid twice would appear twice in the queue.
    """
    rows = _cached("payments", lambda: db.select(
        "payments",
        "select=id,user_id,amount,txn_ref,status,reject_reason,screenshot_url,"
        "payee_upi,approval_note,created_at,approved_at&order=created_at.asc",
    ))
    latest: Dict[str, Dict[str, Any]] = {}
    attempts: Dict[str, int] = defaultdict(int)
    for r in rows:
        uid = r["user_id"]
        latest[uid] = r  # ascending order, so the last write wins
        if r.get("txn_ref"):
            attempts[uid] += 1
    for uid, row in latest.items():
        row["attempt_no"] = attempts.get(uid, 0)
    return latest


def _verified_emails() -> set:
    """A consumed OTP is proof the address works."""
    rows = _cached("verified_emails", lambda: db.select(
        "login_otps", "select=user_id&consumed_at=not.is.null"))
    return {r["user_id"] for r in rows}


def _capacity_unit(event: Dict[str, Any]) -> str:
    """A team event's capacity counts teams; an individual event counts heads."""
    return "TEAMS" if (event.get("max_team") or 1) > 1 else "PARTICIPANTS"


def _closure_notes() -> Dict[str, Dict[str, Any]]:
    """
    Who closed each event and why, newest first.

    Read through the public-schema client: admin_audit_log lives in `public`,
    and zin26_db pins Accept-Profile: zin26 so it cannot see it.
    """
    from services.supabase_client import get

    ok, rows = get(
        "admin_audit_log?select=admin_name,reason,created_at,action,target_id"
        "&target_type=eq.event&action=in.(EVENT_CLOSE,EVENT_OPEN)"
        "&order=created_at.desc&limit=200"
    )
    out: Dict[str, Dict[str, Any]] = {}
    if ok and isinstance(rows, list):
        for r in rows:  # newest first, so the first one seen per event wins
            out.setdefault(r["target_id"], r)
    return out


# ==============================================================================
# F2 — EVENT CAPACITY AND CLOSURE
# ==============================================================================
def _build_event_rows(admin: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    admin = admin or getattr(g, "admin", None) or {}
    events, regs, teams = _events(), _registrations(), _teams()
    participants = {p["user_id"]: p for p in _participants()}

    heads: Dict[str, set] = defaultdict(set)
    held: Dict[str, set] = defaultdict(set)
    paid: Dict[str, set] = defaultdict(set)
    for r in regs:
        code, uid = r["event_code"], r["user_id"]
        heads[code].add(uid)
        if str(r.get("status", "")).upper() == "HELD":
            held[code].add(uid)
        if str(participants.get(uid, {}).get("payment_status", "")).upper() == "APPROVED":
            paid[code].add(uid)

    team_all: Dict[str, set] = defaultdict(set)
    team_conf: Dict[str, set] = defaultdict(set)
    team_pend: Dict[str, set] = defaultdict(set)
    for t in teams:
        st = str(t.get("status", "")).upper()
        if st == "CANCELLED":
            continue
        code = t["event_code"]
        team_all[code].add(t["team_id"])
        (team_conf if st == "CONFIRMED" else team_pend)[code].add(t["team_id"])

    notes = _closure_notes()
    now = dt.datetime.now(dt.timezone.utc)
    out = []

    for e in events:
        code = e["code"]
        unit = _capacity_unit(e)
        used = len(team_all[code]) if unit == "TEAMS" else len(heads[code])
        cap = e.get("capacity")
        closes = _parse(e.get("reg_closes_at"))
        note = notes.get(code, {})

        if not e.get("is_active"):
            # Distinguish "we hit the cap" from "someone closed it".
            state = "FULL" if (cap is not None and used >= cap) else "CLOSED"
        elif closes and closes < now:
            state = "CLOSED"
        elif cap and used >= cap:
            state = "FULL"
        elif cap and used >= cap * 0.9:
            state = "NEARLY_FULL"
        else:
            state = "OPEN"

        out.append({
            "event_code": code,
            "name": e.get("name"),
            "category": e.get("category"),
            "capacity": cap,
            "capacity_unit": unit,
            "capacity_is_locked": bool(e.get("capacity_is_locked")),
            "is_active": bool(e.get("is_active")),
            "registration_open": bool(e.get("is_active")),
            "reg_closes_at": e.get("reg_closes_at"),
            "min_team": e.get("min_team"),
            "max_team": e.get("max_team"),
            "participants_confirmed": len(heads[code]) - len(held[code]),
            "participants_held": len(held[code]),
            "participants_used": len(heads[code]),
            "teams_confirmed": len(team_conf[code]),
            "teams_pending": len(team_pend[code]),
            "teams_used": len(team_all[code]),
            "paid_confirmed": len(paid[code]),
            "used": used,
            "remaining": None if cap is None else max(0, cap - used),
            "pct": None if not cap else min(999, round(used / cap * 100)),
            "state": state,
            "closed_by": note.get("admin_name") if note.get("action") == "EVENT_CLOSE" else None,
            "closed_reason": note.get("reason") if note.get("action") == "EVENT_CLOSE" else None,
            "closed_at": note.get("created_at") if note.get("action") == "EVENT_CLOSE" else None,
        })

    if (admin.get("role") or "").upper() == "EVENT_COORDINATOR":
        allowed = set(admin.get("allowed_events") or [])
        out = [e for e in out if e["event_code"] in allowed]
    return out


def list_events(admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {"success": True, "events": _build_event_rows(admin)}


def _one_event(event_code: str) -> Optional[Dict[str, Any]]:
    return next((e for e in _build_event_rows({}) if e["event_code"] == event_code), None)


def set_capacity(
    event_code: str,
    capacity: Any = "__unset__",
    reg_closes_at: Any = "__unset__",
    capacity_unit: Optional[str] = None,   # derived from max_team; accepted and ignored
) -> Dict[str, Any]:
    current = _one_event(event_code)
    if not current:
        return {"success": False, "error_code": "NOT_FOUND", "message": f"Unknown event '{event_code}'."}

    patch: Dict[str, Any] = {}

    if capacity != "__unset__":
        if current["capacity_is_locked"]:
            return {
                "success": False,
                "error_code": "CAPACITY_LOCKED",
                "message": "This event's capacity is fixed by the timetable and cannot be changed here.",
            }
        if capacity in (None, ""):
            patch["capacity"] = None
        else:
            try:
                cap_int = int(capacity)
            except (TypeError, ValueError):
                return {"success": False, "error_code": "VALIDATION_ERROR",
                        "message": "Capacity must be a whole number, or blank for unlimited."}
            if cap_int < 0:
                return {"success": False, "error_code": "VALIDATION_ERROR",
                        "message": "Capacity cannot be negative."}
            used = current["used"]
            if cap_int < used:
                unit = "teams" if current["capacity_unit"] == "TEAMS" else "participants"
                return {
                    "success": False,
                    "error_code": "CAPACITY_BELOW_CURRENT",
                    "message": (f"{used} {unit} are already registered. Close registration "
                                f"instead, or set {used} or more."),
                }
            patch["capacity"] = cap_int

    if reg_closes_at != "__unset__":
        patch["reg_closes_at"] = reg_closes_at or None

    if not patch:
        return {"success": True, "message": "Nothing to change."}

    db.update("events", f"code=eq.{event_code}", patch)
    log_action("EVENT_CAPACITY_SET", "event", event_code, detail=patch)
    return {"success": True, "message": "Saved.", "changed": patch}


def set_open(
    event_code: str,
    is_open: bool,
    reason: str = "",
    acknowledge_overfill: bool = False,
) -> Dict[str, Any]:
    """
    Writes zin26.events.is_active — the same flag the participant site reads,
    so closing here actually closes registration there.
    """
    current = _one_event(event_code)
    if not current:
        return {"success": False, "error_code": "NOT_FOUND", "message": f"Unknown event '{event_code}'."}

    if is_open:
        cap, used = current["capacity"], current["used"]
        if cap is not None and used >= cap and not acknowledge_overfill:
            # Manual open beats the cap, but the operator has to mean it.
            return {
                "success": False,
                "error_code": "WOULD_OVERFILL",
                "message": (f"{used} of {cap} places are already taken. Reopening will allow "
                            f"registrations beyond capacity."),
            }
    elif not (reason or "").strip():
        return {"success": False, "error_code": "REASON_REQUIRED",
                "message": "A reason is required so the audit log explains the closure."}

    db.update("events", f"code=eq.{event_code}", {"is_active": bool(is_open)})
    log_action("EVENT_OPEN" if is_open else "EVENT_CLOSE", "event", event_code,
               reason=(reason or None))
    return {"success": True,
            "message": "Registration reopened." if is_open else "Registration closed."}


def event_roster(event_code: str, admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    admin = admin or getattr(g, "admin", None) or {}
    if (admin.get("role") or "").upper() == "EVENT_COORDINATOR" \
            and event_code not in (admin.get("allowed_events") or []):
        return {"success": False, "error_code": "FORBIDDEN",
                "message": "You are not a coordinator for this event."}

    return {"success": True, "event": _one_event(event_code),
            "roster": _event_roster_rows(event_code)}


def _event_roster_rows(event_code: str) -> List[Dict[str, Any]]:
    regs = [r for r in _registrations() if r["event_code"] == event_code]
    if not regs:
        return []
    people = {p["user_id"]: p for p in _participants()}
    teams = {t["team_id"]: t for t in _teams()}
    members = {(m["team_id"], m["user_id"]): m for m in _team_members()}

    out = []
    for r in regs:
        p = people.get(r["user_id"], {})
        t = teams.get(r.get("team_id") or "", {})
        m = members.get((r.get("team_id"), r["user_id"]), {})
        out.append({
            "event_code": event_code,
            "team_name": t.get("team_name"),
            "team_status": t.get("status"),
            "user_id": r["user_id"],
            "name": p.get("name"),
            "email": p.get("email"),
            "phone": p.get("phone"),
            "college": p.get("college"),
            "food": p.get("food_preference"),
            "payment_status": p.get("payment_status"),
            "role": m.get("role"),
            "accept_status": m.get("accept_status"),
        })
    out.sort(key=lambda r: (r["team_name"] or "~", r["name"] or ""))
    return out


# ==============================================================================
# F1 — PAYMENT VERIFICATION
# ==============================================================================
def _payee_bank(payee_upi: Any) -> str:
    """
    Which bank took this payment, for the queue's Bank column.

    Resolved through the configured accounts, never parsed out of the VPA: a
    UPI handle suffix names the payment app's sponsor bank rather than the
    account the money reached, so reading "@okaxis" as "Axis" would send the
    treasurer to the wrong statement. Empty for a row written before the fee
    was split across two accounts.
    """
    if not payee_upi:
        return ""
    from services import pending_registration as pending

    return pending.payee_by_upi(str(payee_upi)).get("bank", "")


def _flags(p: Dict[str, Any], pay: Dict[str, Any], verified: bool, dup_refs: set) -> List[str]:
    flags = []
    amount = pay.get("amount")
    if amount is not None and float(amount) != float(REGISTRATION_FEE):
        flags.append("AMOUNT_MISMATCH")
    if pay.get("txn_ref") and pay["txn_ref"] in dup_refs:
        flags.append("DUPLICATE_REF")
    if (pay.get("attempt_no") or 0) > 1:
        flags.append("RESUBMISSION")
    if pay.get("txn_ref") and not pay.get("screenshot_url"):
        flags.append("NO_SCREENSHOT")
    if not verified:
        flags.append("EMAIL_UNVERIFIED")
    # Approved without a bank check. Last in the list but the one that matters
    # most at reconciliation time: this money will never appear in a statement.
    if pay.get("approval_note"):
        flags.append("BYPASSED")
    return flags


def _queue_rows() -> List[Dict[str, Any]]:
    people = _participants()
    pays = _latest_payments()
    verified = _verified_emails()

    seen: Dict[str, int] = defaultdict(int)
    for pay in pays.values():
        if pay.get("txn_ref"):
            seen[pay["txn_ref"]] += 1
    dup_refs = {ref for ref, n in seen.items() if n > 1}

    events = {e["code"]: e["name"] for e in _events()}
    by_user: Dict[str, List[str]] = defaultdict(list)
    for r in _registrations():
        by_user[r["user_id"]].append(events.get(r["event_code"], r["event_code"]))

    rows = []
    for p in people:
        uid = p["user_id"]
        pay = pays.get(uid, {})
        ev = sorted(by_user.get(uid, []))
        rows.append({
            **p,
            "registration_id": p.get("master_qr_token"),
            "registered_at": p.get("created_at"),
            "payment_id": pay.get("id"),
            "amount": pay.get("amount"),
            "txn_ref": pay.get("txn_ref"),
            "payment_attempt_status": pay.get("status"),
            "reject_reason": pay.get("reject_reason"),
            "screenshot_url": pay.get("screenshot_url"),
            "payee_bank": _payee_bank(pay.get("payee_upi")),
            "approval_note": pay.get("approval_note"),
            "submitted_at": pay.get("created_at") if pay.get("txn_ref") else None,
            "approved_at": pay.get("approved_at"),
            "attempt_no": pay.get("attempt_no", 0),
            "email_verified": uid in verified,
            "events_count": len(ev),
            "event_list": ", ".join(ev) or None,
            "flags": _flags(p, pay, uid in verified, dup_refs),
        })
    return rows


def payments_queue(status: str = "PENDING", q: str = "", flag: str = "", page: int = 1) -> Dict[str, Any]:
    rows = _queue_rows()
    status = (status or "PENDING").upper()

    def bucket(r):
        if not r.get("txn_ref"):
            return "UNPAID"
        return str(r.get("payment_status", "PENDING")).upper()

    counts = {k: 0 for k in ("PENDING", "APPROVED", "REJECTED", "UNPAID")}
    for r in rows:
        counts[bucket(r)] = counts.get(bucket(r), 0) + 1

    if status != "ALL":
        rows = [r for r in rows if bucket(r) == status]
    if flag:
        rows = [r for r in rows if flag.upper() in (r.get("flags") or [])]
    if q:
        t = q.strip().lower()
        rows = [r for r in rows if any(
            t in str(r.get(f) or "").lower()
            for f in ("user_id", "name", "email", "phone", "txn_ref", "college"))]

    # Oldest first while pending: whoever has waited longest is dealt with first.
    rows.sort(key=lambda r: (r.get("submitted_at") or r.get("registered_at") or ""),
              reverse=(status != "PENDING"))

    page = max(1, int(page or 1))
    start = (page - 1) * QUEUE_PAGE_SIZE
    return {
        "success": True,
        "payments": rows[start:start + QUEUE_PAGE_SIZE],
        "page": page,
        "page_size": QUEUE_PAGE_SIZE,
        "total": len(rows),
        "counts": counts,
    }


def _shares_txn_ref(uid: str, txn_ref: str) -> bool:
    """
    Does another participant's latest attempt carry this same reference?

    The queue derives DUPLICATE_REF by counting every latest attempt at once.
    One record cannot afford that, so this asks the same question the narrow
    way: who else has ever used this reference, and is it still their current
    one. Usually zero rows come back and the second query never runs.
    """
    others = {
        r["user_id"]
        for r in db.select("payments", f"select=user_id&txn_ref=eq.{db.enc(txn_ref)}")
        if r["user_id"] != uid
    }
    if not others:
        return False

    rows = db.select(
        "payments",
        f"select=user_id,txn_ref&user_id=in.({','.join(sorted(others))})&order=created_at.asc",
    )
    latest = {r["user_id"]: r.get("txn_ref") for r in rows}  # ascending, last write wins
    return any(ref == txn_ref for ref in latest.values())


def payment_detail(user_id: str) -> Dict[str, Any]:
    """
    One participant's payment record.

    Built from targeted reads rather than from _queue_rows(): rebuilding the
    whole queue - every participant, every payment, every registration - to
    find a single row took ~3.5s, and the drawer renders nothing at all until
    it lands, so that was 3.5s of blank panel before the proof image was even
    requested.
    """
    uid = user_id.strip().upper()
    enc_uid = db.enc(uid)

    # Every PostgREST call costs about half a second of round trip whatever it
    # returns, so what makes the drawer slow is the NUMBER of reads, not their
    # size. These five do not depend on each other, so they go at once.
    with ThreadPoolExecutor(max_workers=5) as pool:
        f_participant = pool.submit(
            db.select_one, "participants",
            "select=user_id,name,email,phone,college,department,year,food_preference,"
            f"payment_status,master_qr_token,created_at&user_id=eq.{enc_uid}",
        )
        f_attempts = pool.submit(
            db.select, "payments",
            f"select=id,amount,txn_ref,status,reject_reason,screenshot_url,approval_note,"
            f"created_at,approved_at"
            f"&user_id=eq.{enc_uid}&order=created_at.desc",
        )
        f_regs = pool.submit(
            db.select, "registrations",
            f"select=reg_id,event_code,status,team_id,created_at&user_id=eq.{enc_uid}",
        )
        f_otp = pool.submit(
            db.select_one, "login_otps",
            f"select=user_id&user_id=eq.{enc_uid}&consumed_at=not.is.null",
        )
        f_events = pool.submit(_events)

        participant = f_participant.result()
        attempts = f_attempts.result()
        registrations = f_regs.result()
        verified = bool(f_otp.result())
        event_rows = f_events.result()

    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Registration not found."}

    pay = dict(attempts[0]) if attempts else {}
    pay["attempt_no"] = sum(1 for a in attempts if a.get("txn_ref"))

    dup_refs = set()
    if pay.get("txn_ref") and _shares_txn_ref(uid, pay["txn_ref"]):
        dup_refs.add(pay["txn_ref"])

    events = {e["code"]: e["name"] for e in event_rows}
    ev = sorted(events.get(r["event_code"], r["event_code"]) for r in registrations)

    row = {
        **participant,
        "registration_id": participant.get("master_qr_token"),
        "registered_at": participant.get("created_at"),
        "payment_id": pay.get("id"),
        "amount": pay.get("amount"),
        "txn_ref": pay.get("txn_ref"),
        "payment_attempt_status": pay.get("status"),
        "reject_reason": pay.get("reject_reason"),
        "screenshot_url": pay.get("screenshot_url"),
        "approval_note": pay.get("approval_note"),
        "submitted_at": pay.get("created_at") if pay.get("txn_ref") else None,
        "approved_at": pay.get("approved_at"),
        "attempt_no": pay["attempt_no"],
        "email_verified": verified,
        "events_count": len(ev),
        "event_list": ", ".join(ev) or None,
        "flags": _flags(participant, pay, verified, dup_refs),
    }
    return {"success": True, "payment": row, "attempts": attempts, "registrations": registrations}


def screenshot_url(user_id: str) -> Dict[str, Any]:
    """
    Short-lived viewable URL for the proof image. The column stores a
    reference, never a URL — a stored signed URL would expire and a stored
    public one would leak the proof to anybody who finds the row.

    Every form the column can hold is handled in services/proof_reference, so
    the treasurer's panel, the participant's own page and the legacy endpoint
    cannot disagree about what a reference means.
    """
    row = db.select_one(
        "payments",
        f"select=screenshot_url&user_id=eq.{db.enc(user_id.strip().upper())}"
        f"&screenshot_url=not.is.null&order=created_at.desc",
    )
    if not row or not row.get("screenshot_url"):
        return {"success": False, "error_code": "NO_SCREENSHOT",
                "message": "No payment screenshot was submitted."}

    from services import proof_reference

    return proof_reference.resolve(row["screenshot_url"])


def review_payment(user_id: str, approve: bool, reason: str = "", bypass: bool = False) -> Dict[str, Any]:
    """
    Wraps participant_service.treasurer_review_payment, which already owns this
    transition: it sends the confirmation email, holds registrations on
    rejection (D1) and is idempotent. This adds the audit row.
    """
    from services.participant_service import treasurer_review_payment

    admin = getattr(g, "admin", None) or {}
    res = treasurer_review_payment(
        user_id=user_id,
        action="BYPASS" if bypass else ("APPROVE" if approve else "REJECT"),
        reason=reason,
        admin_name=admin.get("name", "Treasurer"),
        admin_id=str(admin.get("id", "")),
    )
    if res.get("success"):
        log_action("PAYMENT_BYPASS" if bypass else ("PAYMENT_APPROVE" if approve else "PAYMENT_REJECT"),
                   "participant",
                   user_id, reason=reason or None,
                   detail={"already_approved": bool(res.get("already_approved")),
                           "email_sent": res.get("email_sent")})

        # treasurer_review_payment swallows a failed send so the approval still
        # commits — right call, but it reports "the participant has been
        # emailed" either way. If the mail did not go, say so, or a treasurer
        # marks someone confirmed who never received their pass.
        if approve and not res.get("already_approved") and res.get("email_sent") is False:
            res["email_failed"] = True
            res["message"] = (
                f"Payment approved for {user_id}, but the confirmation email could NOT be "
                f"sent. Their pass has not reached them — use Resend pass."
            )
    return res


def resend_pass(user_id: str) -> Dict[str, Any]:
    """
    Re-send EMAIL #2 (UserID, master QR, WhatsApp group link) to an already
    approved participant.

    treasurer_review_payment short-circuits on an already-approved record and
    returns without emailing, so re-approving is not a way to resend. This is —
    for the participant who deleted the mail, or whose send failed at the time.
    Approval state is not touched.
    """
    uid = (user_id or "").strip().upper()
    participant = db.select_one(
        "participants",
        f"select=user_id,name,email,payment_status,master_qr_token&user_id=eq.{uid}",
    )
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Registration not found."}

    if str(participant.get("payment_status", "")).upper() != "APPROVED":
        return {
            "success": False,
            "error_code": "NOT_APPROVED",
            "message": "The pass is only issued once the payment is approved.",
        }

    from services.email_service import send_master_qr_email

    res = send_master_qr_email(participant) or {}
    if not res.get("success"):
        log_action("PASS_RESEND_FAILED", "participant", uid,
                   detail={"error": res.get("error"), "status": res.get("status")})
        return {
            "success": False,
            "error_code": res.get("status") or "EMAIL_FAILED",
            "message": res.get("error") or "The email could not be sent.",
        }

    log_action("PASS_RESEND", "participant", uid, detail={"to": participant.get("email")})
    return {"success": True,
            "message": f"Pass re-sent to {participant.get('email')}."}


def bulk_approve(user_ids: List[str]) -> Dict[str, Any]:
    """Unflagged rows only — a bulk action that can approve a mismatched amount eventually will."""
    ids = [str(u).strip().upper() for u in (user_ids or []) if str(u).strip()]
    if not ids:
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "No registrations selected."}
    if len(ids) > 100:
        return {"success": False, "error_code": "TOO_MANY", "message": "Approve at most 100 at a time."}

    by_id = {r["user_id"]: r for r in _queue_rows()}
    approved, skipped = [], []
    for uid in ids:
        row = by_id.get(uid)
        if not row:
            skipped.append({"user_id": uid, "why": "not found"})
        elif row.get("flags"):
            skipped.append({"user_id": uid, "why": ", ".join(row["flags"]).lower().replace("_", " ")})
        elif not row.get("txn_ref"):
            skipped.append({"user_id": uid, "why": "no payment submitted"})
        else:
            res = review_payment(uid, approve=True)
            if res.get("success"):
                approved.append(uid)
            else:
                skipped.append({"user_id": uid, "why": res.get("message", "failed")})

    return {"success": True, "approved": approved, "skipped": skipped,
            "message": f"Approved {len(approved)}, skipped {len(skipped)}."}


# ==============================================================================
# F4 — DASHBOARD
# ==============================================================================
def dashboard(mode: str = "registration", admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    admin = admin or getattr(g, "admin", None) or {}
    role = (admin.get("role") or "").upper()

    people = _participants()
    pays = _latest_payments()
    events = _build_event_rows({})
    regs = _registrations()
    teams = _teams()

    def npay(s):
        return sum(1 for p in people if str(p.get("payment_status", "")).upper() == s)

    awaiting = sum(1 for pay in pays.values()
                   if pay.get("txn_ref") and str(pay.get("status", "")).upper() == "PENDING")

    totals = {
        "participants": len(people),
        "payment_approved": npay("APPROVED"),
        "payment_pending": npay("PENDING"),
        "payment_rejected": npay("REJECTED"),
        "awaiting_review": awaiting,
        "veg": sum(1 for p in people if str(p.get("food_preference", "")).upper() == "VEG"),
        "non_veg": sum(1 for p in people if str(p.get("food_preference", "")).upper() == "NON_VEG"),
        "event_registrations": len(regs),
        "teams_confirmed": sum(1 for t in teams if str(t.get("status", "")).upper() == "CONFIRMED"),
        "teams_awaiting": sum(1 for t in teams if str(t.get("status", "")).upper() == "PENDING_ACCEPTANCE"),
    }

    revenue = {
        "collected": sum(float(p.get("amount") or 0) for p in pays.values()
                         if str(p.get("status", "")).upper() == "APPROVED"),
        "pending": sum(float(p.get("amount") or 0) for p in pays.values()
                       if p.get("txn_ref") and str(p.get("status", "")).upper() == "PENDING"),
    }

    trend: Dict[str, int] = defaultdict(int)
    for p in people:
        d = (p.get("created_at") or "")[:10]
        if d:
            trend[d] += 1

    colleges: Dict[str, int] = defaultdict(int)
    for p in people:
        colleges[p.get("college") or "—"] += 1

    # Teammates who never answered inside the 24h window (D2): the captain may swap them.
    timed_out = 0
    pending_team_ids = {t["team_id"] for t in teams
                        if str(t.get("status", "")).upper() == "PENDING_ACCEPTANCE"}
    if pending_team_ids:
        for m in db.select("team_members", "select=team_id,accept_status,invited_at"):
            if (m["team_id"] in pending_team_ids
                    and str(m.get("accept_status", "")).upper() == "PENDING"
                    and _hours_since(m.get("invited_at")) > 24):
                timed_out += 1

    now = dt.datetime.now(dt.timezone.utc)
    attention = {
        "payments_over_24h": sum(
            1 for pay in pays.values()
            if pay.get("txn_ref") and str(pay.get("status", "")).upper() == "PENDING"
            and _hours_since(pay.get("created_at")) > 24),
        "payments_pending": awaiting,
        "payments_rejected": totals["payment_rejected"],
        "held_registrations": sum(1 for r in regs if str(r.get("status", "")).upper() == "HELD"),
        "teams_timed_out": timed_out,
        "events_near_full": sum(1 for e in events if e["state"] == "NEARLY_FULL"),
        "events_full": sum(1 for e in events if e["state"] == "FULL"),
        "events_closing_48h": sum(
            1 for e in events
            if e["is_active"] and _parse(e["reg_closes_at"])
            and now <= _parse(e["reg_closes_at"]) <= now + dt.timedelta(hours=48)),
    }

    from services.supabase_client import get as pub_get
    ok, recent = pub_get(
        "admin_audit_log?select=admin_name,action,target_type,target_id,created_at"
        "&order=created_at.desc&limit=12")

    data: Dict[str, Any] = {
        "generated_at": _now(),
        "mode": mode,
        "role": role,
        "totals": totals,
        "revenue": revenue,
        "capacity": events,
        "trend": [{"d": d, "n": n} for d, n in sorted(trend.items())],
        "colleges": [{"college": c, "n": n}
                     for c, n in sorted(colleges.items(), key=lambda kv: -kv[1])[:10]],
        "attention": attention,
        "recent": recent if ok and isinstance(recent, list) else [],
    }

    # Strip what a role has no business seeing, here rather than in the browser.
    if role == "EVENT_COORDINATOR":
        allowed = set(admin.get("allowed_events") or [])
        data["capacity"] = [e for e in data["capacity"] if e["event_code"] in allowed]
        for k in ("revenue", "colleges", "recent"):
            data.pop(k, None)
        for k in ("payments_over_24h", "payments_pending", "payments_rejected"):
            attention.pop(k, None)
    elif role in ("GATE_ADMIN", "FOOD_ADMIN"):
        data = {"generated_at": data["generated_at"], "mode": mode, "role": role, "totals": totals}
    elif role == "TREASURER":
        data.pop("colleges", None)

    return {"success": True, "dashboard": data}


# ==============================================================================
# SETTINGS
# ==============================================================================
ALLOWED_SETTINGS = {
    "registration_fee", "default_reg_closes_at", "short_film_closes_at",
    "event_date", "allow_tight_b1", "warn_tight_b1", "team_accept_timeout_h",
}


def get_settings() -> Dict[str, Any]:
    from services.supabase_client import get_settings as _all
    return {"success": True, "settings": _all()}


def update_settings(patch: Dict[str, Any]) -> Dict[str, Any]:
    import requests
    from services.passport_service import SUPABASE_URL, get_headers

    unknown = set(patch) - ALLOWED_SETTINGS
    if unknown:
        return {"success": False, "error_code": "UNKNOWN_SETTING",
                "message": f"Not a known setting: {', '.join(sorted(unknown))}."}

    admin = getattr(g, "admin", None) or {}
    for key, value in patch.items():
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/app_settings?key=eq.{key}",
            headers=get_headers(prefer_return="minimal"),
            json={"value": value, "updated_by": admin.get("name", "admin"), "updated_at": _now()},
            timeout=6,
        )
    log_action("SETTINGS_UPDATE", "setting", ",".join(sorted(patch)), detail=patch)
    return {"success": True, "message": "Settings saved."}
