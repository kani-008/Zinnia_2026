"""
Zinnia 2026 — server-side rule engine (doc §2, §2.1, §3).

WHY THIS EXISTS ALONGSIDE src/lib/rules/engine.ts
-------------------------------------------------
§2.1 says these are "the hard rules the backend must enforce". The backend is
Flask, so the authority has to be Python. The TypeScript engine is not the
authority — it drives optimistic card states in the browser so the UI can grey
out a card with a real reason before the server round-trips (§4.3).

Two implementations of the same rules will drift unless something pins them
together. Three things do:
  1. Both mirror the SAME seed data (006_zin26_seed.sql). test_rules_engine.py
     parses that SQL and fails if this catalogue disagrees, exactly as
     engine.test.ts does on the TypeScript side.
  2. Both are tested against the SAME combination matrix from §3.
  3. Rule IDs and rejection codes are identical, so a mismatch shows up as a
     different `code` in the response rather than as silent divergence.

If you change a rule, change it in both and run `npm test` AND
`python -m pytest backend/test_rules_engine.py`.
"""

from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

# The two halves of the day that carry a minute budget. LUNCH and PRIZE have no
# events, so nothing is ever scheduled against them.
MORNING = "MORNING"
AFTERNOON = "AFTERNOON"

WINDOW_ORDER: Tuple[str, str] = (MORNING, AFTERNOON)


@dataclass(frozen=True)
class BlockDef:
    code: str
    label: str
    minutes: int
    window: Optional[str]


@dataclass(frozen=True)
class WindowDef:
    code: str
    label: str
    total_minutes: int


@dataclass(frozen=True)
class EventDef:
    code: str
    name: str
    category: str
    type: str
    min_team: int
    max_team: int
    capacity: Optional[int]
    duration_min: int
    window: Optional[str]
    blocks: Tuple[str, ...]
    counts_toward_limit: bool
    reg_closes_at: str
    is_active: bool = True


BLOCKS: Dict[str, BlockDef] = {
    "B1": BlockDef("B1", "11:00 - 12:00", 60, MORNING),
    "B2": BlockDef("B2", "12:00 - 1:00", 60, MORNING),
    "LUNCH": BlockDef("LUNCH", "1:00 - 2:00", 60, None),
    "B3": BlockDef("B3", "2:00 - 2:30", 30, AFTERNOON),
    "B4": BlockDef("B4", "2:30 - 3:00", 30, AFTERNOON),
    "PRIZE": BlockDef("PRIZE", "3:00 - 4:00", 60, None),
}

WINDOWS: Dict[str, WindowDef] = {
    MORNING: WindowDef(MORNING, "11:00-1:00", 120),
    AFTERNOON: WindowDef(AFTERNOON, "2:00-3:00", 60),
}

_CLOSES_DEFAULT = "2026-09-22T23:59:59+05:30"
_CLOSES_SHORT_FILM = "2026-09-20T23:59:59+05:30"

# Explicit display order for every catalog the participant sees. Sorting by
# code (alphabetical) or by DB sort_order both produced the wrong sequence at
# different times; this tuple is the single source of truth and the DB's
# zin26.events.sort_order has been aligned to it.
DISPLAY_ORDER: Tuple[str, ...] = (
    "DEBUGGING",
    "LAST_SIGNAL",
    "LOST_IN_SQL",
    "GADGET_CODES",
    "PAPER_PRESENTATION",
    "BORDERLAND",
    "THINK_STRIKE_WIN",
    "PLOT_TWIST",
    "SHORT_FILM",
)


def display_index(code: str) -> int:
    return DISPLAY_ORDER.index(code) if code in DISPLAY_ORDER else len(DISPLAY_ORDER)


EVENTS: Dict[str, EventDef] = {
    "PAPER_PRESENTATION": EventDef(
        # capacity is 30 TEAMS, not 30 people: capacity_map() and
        # zin26.register_participant_event both count distinct teams for an
        # event with max_team > 1, so a team of 2 and a team of 3 each take one.
        "PAPER_PRESENTATION", "Paper Verse", "TECH", "SLOT",
        2, 3, 30, 15, None, (), True, _CLOSES_DEFAULT,
    ),
    "GADGET_CODES": EventDef(
        "GADGET_CODES", "Gadget Codes", "TECH", "FIXED",
        2, 2, None, 180, None, ("B1", "B2", "B3", "B4"), True, _CLOSES_DEFAULT,
    ),
    "LAST_SIGNAL": EventDef(
        "LAST_SIGNAL", "The Last Signal", "TECH", "RUNNING",
        1, 1, None, 30, MORNING, (), True, _CLOSES_DEFAULT,
    ),
    "DEBUGGING": EventDef(
        "DEBUGGING", "Debugging Protocol", "TECH", "RUNNING",
        1, 1, None, 30, MORNING, (), True, _CLOSES_DEFAULT,
    ),
    "LOST_IN_SQL": EventDef(
        # Individual event (min_team == max_team == 1), per the coordinators'
        # team-size list of 6 September 2026. This SUPERSEDES migration
        # 005_lost_in_sql_team_of_two.sql, which had set it to a pair.
        # Mirrors src/lib/rules/catalog.ts and zin26.events; move all three
        # together or the browser offers a size the server rejects.
        "LOST_IN_SQL", "Lost in SQL", "TECH", "RUNNING",
        1, 1, None, 30, AFTERNOON, (), True, _CLOSES_DEFAULT,
    ),
    "BORDERLAND": EventDef(
        "BORDERLAND", "Borderland @ GCEE", "NON_TECH", "FIXED",
        3, 3, None, 120, None, ("B2", "B3", "B4"), True, _CLOSES_DEFAULT,
    ),
    "THINK_STRIKE_WIN": EventDef(
        "THINK_STRIKE_WIN", "Think, Strike, Win", "NON_TECH", "FIXED",
        3, 3, None, 60, None, ("B3", "B4"), True, _CLOSES_DEFAULT,
    ),
    "PLOT_TWIST": EventDef(
        "PLOT_TWIST", "Plot Twist", "NON_TECH", "FIXED",
        3, 3, None, 60, None, ("B3", "B4"), True, _CLOSES_DEFAULT,
    ),
    "SHORT_FILM": EventDef(
        # Team of exactly 1 (ruling of 4 September 2026). It is online, occupies
        # no block and counts toward no limit, so team composition affects no
        # rule - which is why it is registered individually rather than as a
        # team. Keep in step with src/lib/rules/catalog.ts and zin26.events.
        "SHORT_FILM", "Short Film", "NON_TECH", "ONLINE",
        1, 1, None, 0, None, (), True, _CLOSES_SHORT_FILM,
    ),
}

FIXED_AFTERNOON = tuple(
    e.code for e in EVENTS.values()
    if e.type == "FIXED" and any(BLOCKS[b].window == AFTERNOON for b in e.blocks)
)

DEFAULT_CONFIG = {
    "max_counted_events": 3,
    "allow_tight_b1": True,
    "warn_tight_b1": True,
}


@dataclass
class Warning:
    rule: str
    code: str
    message: str
    requires_confirmation: bool = True


@dataclass
class Decision:
    ok: bool
    rule: str = ""
    code: str = ""
    message: str = ""
    warnings: List[Warning] = field(default_factory=list)
    user_id: str = ""

    def as_dict(self) -> Dict[str, object]:
        if self.ok:
            return {
                "ok": True,
                "warnings": [
                    {
                        "rule": w.rule,
                        "code": w.code,
                        "message": w.message,
                        "requires_confirmation": w.requires_confirmation,
                    }
                    for w in self.warnings
                ],
            }
        out = {"ok": False, "rule": self.rule, "code": self.code, "message": self.message}
        if self.user_id:
            out["user_id"] = self.user_id
        return out


def _ok(warnings: Optional[List[Warning]] = None) -> Decision:
    return Decision(ok=True, warnings=warnings or [])


def _no(rule: str, code: str, message: str, user_id: str = "") -> Decision:
    return Decision(ok=False, rule=rule, code=code, message=message, user_id=user_id)


# --- small helpers ---------------------------------------------------------

def _ev(code: str) -> EventDef:
    return EVENTS[code]


def _is_on_campus(code: str) -> bool:
    return _ev(code).type != "ONLINE"


def _is_fixed_afternoon(code: str) -> bool:
    return code in FIXED_AFTERNOON


def _parse_iso(value: str) -> _dt.datetime:
    return _dt.datetime.fromisoformat(value)


def _compute_load(codes: Sequence[str]) -> Dict[str, Dict[str, int]]:
    """
    Minute budget per window.

    FIXED events remove whole blocks from the window's capacity — that is what
    makes Borderland (which eats B2) leave only 60 minutes in the morning.
    RUNNING events spend against what is left. SLOT events are placed after,
    because the organiser picks their block later (§1.2, §4.4).
    """
    load = {
        MORNING: {"available": WINDOWS[MORNING].total_minutes, "used": 0},
        AFTERNOON: {"available": WINDOWS[AFTERNOON].total_minutes, "used": 0},
    }

    blocked = set()
    for code in codes:
        e = _ev(code)
        if e.type == "FIXED":
            blocked.update(e.blocks)

    for b in blocked:
        w = BLOCKS[b].window
        if w:
            load[w]["available"] -= BLOCKS[b].minutes

    for code in codes:
        e = _ev(code)
        if e.type == "RUNNING" and e.window:
            load[e.window]["used"] += e.duration_min

    return load


def _headroom(slot: Dict[str, int]) -> int:
    return slot["available"] - slot["used"]


def _place_slots(codes: Sequence[str], load: Dict[str, Dict[str, int]]) -> Optional[EventDef]:
    """Place each SLOT event into a window with room; most headroom first."""
    for code in codes:
        e = _ev(code)
        if e.type != "SLOT":
            continue
        candidates = sorted(
            (w for w in WINDOW_ORDER if _headroom(load[w]) >= e.duration_min),
            key=lambda w: _headroom(load[w]),
            reverse=True,
        )
        if not candidates:
            return e
        load[candidates[0]]["used"] += e.duration_min
    return None


def _overflowing_window(codes: Sequence[str]) -> Optional[str]:
    load = _compute_load(codes)
    for w in WINDOW_ORDER:
        if load[w]["used"] > load[w]["available"]:
            return w
    if _place_slots(codes, load):
        return max(WINDOW_ORDER, key=lambda w: _headroom(load[w]))
    return None


def _exactly_filled_windows(codes: Sequence[str]) -> List[str]:
    load = _compute_load(codes)
    if _place_slots(codes, load):
        return []
    return [
        w for w in WINDOW_ORDER
        if load[w]["available"] > 0 and load[w]["used"] == load[w]["available"]
    ]


# --- public API ------------------------------------------------------------

def can_register(
    *,
    payment_status: str,
    event_code: str,
    existing: Sequence[str],
    remaining_capacity: Optional[int] = None,
    now: Optional[_dt.datetime] = None,
    config: Optional[Dict[str, object]] = None,
) -> Decision:
    """
    Mirror of canRegister() in src/lib/rules/engine.ts, including check order.

    Two deliberate departures from the §2.1 pseudocode, same as the TS side:
      - R9 runs BEFORE the Short Film early return (the pseudocode as written
        lets Short Film be registered twice);
      - R14 close-date is enforced (the pseudocode omits it entirely).
    """
    cfg = {**DEFAULT_CONFIG, **(config or {})}
    now = now or _dt.datetime.now(_dt.timezone.utc)

    target = EVENTS.get(event_code)
    if target is None:
        return _no("R12", "UNKNOWN_EVENT", "Unknown event")

    held = list(existing)

    # R11 — DECOUPLED. Event selection is no longer gated on the treasurer's
    # verdict. Having an account is the only prerequisite: a participant who has
    # submitted their payment reference can browse, form teams and register
    # immediately, and a participant whose payment was rejected keeps the events
    # they hold while they resubmit (their registration is held, not cancelled).
    #
    # `payment_status` still reaches this function because callers pass it, but
    # it deliberately decides nothing here. It gates exactly two things now, both
    # outside this engine: the master QR (entry pass) and the participants'
    # WhatsApp group link. A card must therefore only ever be blocked for a
    # reason of its own — full, closed, clashing, or over the count.
    _ = payment_status

    # R9 — before the Short Film branch below, which returns OK early.
    if target.code in held:
        return _no("R9", "ALREADY_REGISTERED", "Already registered")

    # R12 — closed by the coordinators, or out of seats.
    if not target.is_active:
        return _no("R12", "EVENT_INACTIVE", "Registrations closed")
    if remaining_capacity is not None and remaining_capacity <= 0:
        return _no("R12", "EVENT_FULL", "Event full")

    # R14 — each event carries its own close date; Short Film closes early.
    if now > _parse_iso(target.reg_closes_at):
        return _no("R14", "REGISTRATION_CLOSED", f"Registrations for {target.name} have closed")

    # R7 — online, so no block and no count, but it needs something to hang off.
    if target.type == "ONLINE":
        if not any(_is_on_campus(c) for c in held):
            return _no("R7", "NEEDS_ON_CAMPUS_EVENT", "Register for at least one other event first")
        return _ok()

    # R1 — every event counts toward the ceiling; nothing is exempt.
    # from the clash rules below.
    if target.counts_toward_limit:
        counted = sum(1 for c in held if _ev(c).counts_toward_limit)
        if counted >= cfg["max_counted_events"]:
            return _no("R1", "EVENT_LIMIT_REACHED", f"Maximum {cfg['max_counted_events']} events reached")

    # R2 — Gadget Codes runs B1-B4, so nothing on campus combines with it.
    if target.code == "GADGET_CODES" and any(_is_on_campus(c) for c in held):
        return _no("R2", "GADGET_CODES_EXCLUSIVE", "Gadget Codes runs all day and cannot be combined")
    if "GADGET_CODES" in held:
        return _no("R2", "GADGET_CODES_EXCLUSIVE", "Gadget Codes runs all day and cannot be combined")

    # R3 — at most one fixed afternoon event.
    if _is_fixed_afternoon(target.code):
        clash = next((c for c in held if _is_fixed_afternoon(c)), None)
        if clash:
            return _no("R3", "AFTERNOON_ALREADY_BOOKED", f"You already have {_ev(clash).name} at 2:00-3:00")

    # R5 — Lost in SQL needs 30 free minutes in B3-B4, in either direction.
    if target.code == "LOST_IN_SQL":
        clash = next((c for c in held if _is_fixed_afternoon(c)), None)
        if clash:
            return _no("R5", "CLASHES_AFTERNOON", f"Clashes with your 2:00-3:00 event ({_ev(clash).name})")
    if _is_fixed_afternoon(target.code) and "LOST_IN_SQL" in held:
        return _no("R5", "CLASHES_LOST_IN_SQL", "Clashes with Lost in SQL")

    # R4 / R6 — per-window minute budget, with the new event added in.
    nxt = held + [target.code]
    overflow = _overflowing_window(nxt)
    if overflow:
        return _no(
            "R6" if overflow == MORNING else "R4",
            "WINDOW_BUDGET_EXCEEDED",
            f"Not enough free time in {WINDOWS[overflow].label}",
        )

    # R15 — legal but with no gap; warn only if THIS event is what closed it.
    warnings: List[Warning] = []
    tight = _exactly_filled_windows(nxt)
    if tight and tight[0] not in _exactly_filled_windows(held):
        if not cfg["allow_tight_b1"]:
            return _no(
                "R15",
                "TIGHT_WINDOW_BLOCKED",
                f"Not enough turnaround time between your {WINDOWS[tight[0]].label} events",
            )
        if cfg["warn_tight_b1"]:
            warnings.append(
                Warning(
                    "R15",
                    "TIGHT_WINDOW",
                    f"These events fill {WINDOWS[tight[0]].label} exactly - no gap between them. Register anyway?",
                )
            )

    return _ok(warnings)


# --- cancellation ----------------------------------------------------------

def can_cancel(
    *,
    event_code: str,
    existing: Sequence[str],
    now: Optional[_dt.datetime] = None,
) -> Decision:
    """
    R14 cancellation, plus the R7 orphan guard.

    Cancelling the last on-campus event while Short Film is held is REJECTED,
    never cascaded — Short Film is not auto-cancelled on the participant's
    behalf (resolved decision, see PHASE1_NOTES.md).
    """
    now = now or _dt.datetime.now(_dt.timezone.utc)

    target = EVENTS.get(event_code)
    if target is None:
        return _no("R14", "UNKNOWN_EVENT", "Unknown event")

    held = list(existing)
    if target.code not in held:
        return _no("R14", "NOT_REGISTERED", f"You are not registered for {target.name}")

    if now > _parse_iso(target.reg_closes_at):
        return _no(
            "R14",
            "CANCELLATION_CLOSED",
            f"Registration for {target.name} has closed — cancellations are no longer possible",
        )

    if _is_on_campus(target.code):
        remaining = [c for c in held if c != target.code]
        online = [c for c in remaining if not _is_on_campus(c)]
        if online and not any(_is_on_campus(c) for c in remaining):
            names = ", ".join(_ev(c).name for c in online)
            return _no(
                "R7",
                "WOULD_ORPHAN_ONLINE_EVENT",
                f"{target.name} is your only on-campus event, and {names} needs at least one. Cancel "
                f"{names} first, then cancel {target.name}.",
            )

    return _ok()


# --- teams -----------------------------------------------------------------

def can_register_team(
    *,
    event_code: str,
    members: Sequence[Dict[str, object]],
    remaining_capacity: Optional[int] = None,
    now: Optional[_dt.datetime] = None,
    config: Optional[Dict[str, object]] = None,
) -> Decision:
    """
    R8/R10 — every member must independently pass R1-R7, and the rejection
    names the member: "ZIN26-0148 already has 3 events" (§2.1).

    `members` is a sequence of {"user_id", "payment_status", "existing"}.
    """
    target = EVENTS.get(event_code)
    if target is None:
        return _no("R12", "UNKNOWN_EVENT", "Unknown event")

    size = len(members)
    if size < target.min_team or size > target.max_team:
        rng = (
            str(target.min_team)
            if target.min_team == target.max_team
            else f"{target.min_team}-{target.max_team}"
        )
        return _no(
            "R10",
            "TEAM_SIZE",
            f"{target.name} needs {rng} members (captain included); you have {size}",
        )

    ids = [m["user_id"] for m in members]
    seen = set()
    for uid in ids:
        if uid in seen:
            return _no("R9", "DUPLICATE_MEMBER", f"{uid} is listed twice in this team", user_id=uid)
        seen.add(uid)

    warnings: List[Warning] = []
    for m in members:
        decision = can_register(
            payment_status=m.get("payment_status", "PENDING"),
            event_code=event_code,
            existing=m.get("existing", []),
            remaining_capacity=remaining_capacity,
            now=now,
            config=config,
        )
        if not decision.ok:
            return _no(
                decision.rule,
                decision.code,
                f"{m['user_id']}: {decision.message}",
                user_id=m["user_id"],
            )
        warnings.extend(decision.warnings)

    return _ok(warnings)


# --- dashboard -------------------------------------------------------------

def evaluate_catalog(
    *,
    payment_status: str,
    existing: Sequence[str],
    capacity_by_event: Optional[Dict[str, Optional[int]]] = None,
    now: Optional[_dt.datetime] = None,
    config: Optional[Dict[str, object]] = None,
) -> List[Dict[str, object]]:
    """Per-card state for the dashboard grid (§4.3), with an explicit reason."""
    held = set(existing)
    capacity_by_event = capacity_by_event or {}
    out = []

    for event in sorted(EVENTS.values(), key=lambda e: display_index(e.code)):
        if not event.is_active:
            continue

        base = {
            "event_code": event.code,
            "display_order": display_index(event.code) + 1,
            "name": event.name,
            # TECH / NON_TECH. The dashboard groups the list by it — nine cards
            # in one undifferentiated run gave no hint that they are two kinds
            # of thing with different rules.
            "category": event.category,
            "min_team": event.min_team,
            "max_team": event.max_team,
            # Two different questions the dashboard asks. `is_team_event` means a
            # team is mandatory (min > 1 — Borderland needs three); `allows_team`
            # means one is merely permitted (max > 1). Paper Verse is both,
            # Debugging is neither, and Short Film is the case that separates them.
            "is_team_event": event.min_team > 1,
            # 1-3, so a team is optional here.
            "allows_team": event.max_team > 1,
        }

        if event.code in held:
            out.append({**base, "state": "REGISTERED"})
            continue

        decision = can_register(
            payment_status=payment_status,
            event_code=event.code,
            existing=held,
            remaining_capacity=capacity_by_event.get(event.code),
            now=now,
            config=config,
        )

        if decision.ok:
            out.append({**base, "state": "AVAILABLE",
                        "warnings": [w.message for w in decision.warnings]})
        else:
            full = decision.code in ("EVENT_FULL", "REGISTRATION_CLOSED")
            out.append({**base, "state": "FULL" if full else "BLOCKED",
                        "reason": decision.message, "rule": decision.rule})

    return out
