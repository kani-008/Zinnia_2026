"""
Zinnia 2026 — Phase 4: dashboard + individual event registration (doc §4.3).

The rule engine in services/rules_engine.py is the authority here. The browser
runs the same rules for optimistic card states, but nothing is written without
passing the server-side check first.

Capacity (R12) is NOT enforced by the pre-check alone — two concurrent requests
can both read "1 seat left". The final insert goes through the
zin26.register_participant_event() RPC from migration 012, which locks the
event row and re-counts inside the transaction.
"""

from __future__ import annotations

import datetime as dt
from typing import Any, Dict, List, Optional

import requests

from services import rules_engine as rules
from services import zin26_db as db
from services.zin26_db import Zin26Error


# --- reads -----------------------------------------------------------------

def held_event_codes(user_id: str) -> List[str]:
    rows = db.select(
        "registrations",
        f"select=event_code&user_id=eq.{user_id}&status=neq.CANCELLED",
    )
    return [r["event_code"] for r in rows]


def capacity_map() -> Dict[str, Optional[int]]:
    """
    Seats remaining per event. None means unlimited.

    One grouped read rather than a query per card — the dashboard renders nine
    cards and this is on the critical path for every page load.
    """
    events = db.select("events", "select=code,capacity,is_active")
    taken = {}
    for row in db.select("registrations", "select=event_code&status=neq.CANCELLED"):
        taken[row["event_code"]] = taken.get(row["event_code"], 0) + 1

    out = {}
    for e in events:
        cap = e.get("capacity")
        out[e["code"]] = None if cap is None else max(cap - taken.get(e["code"], 0), 0)
    return out


def get_dashboard(user_id: str) -> Dict[str, Any]:
    """GET /api/participant/dashboard"""
    participant = db.select_one(
        "participants",
        f"select=user_id,name,email,payment_status,master_qr_token,food_preference&user_id=eq.{user_id}",
    )
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Participant not found."}

    regs = db.select(
        "registrations",
        f"select=reg_id,event_code,status,team_id&user_id=eq.{user_id}&status=neq.CANCELLED",
    )

    # Team names in one round trip rather than one per registration.
    team_ids = [r["team_id"] for r in regs if r.get("team_id")]
    team_names = {}
    if team_ids:
        joined = ",".join(team_ids)
        for t in db.select("teams", f"select=team_id,team_name&team_id=in.({joined})"):
            team_names[t["team_id"]] = t["team_name"]

    held = [r["event_code"] for r in regs]
    counted_used = sum(
        1 for c in held if c in rules.EVENTS and rules.EVENTS[c].counts_toward_limit
    )

    capacity = capacity_map()

    registrations = [
        {
            "reg_id": r["reg_id"],
            "event_code": r["event_code"],
            "event_name": rules.EVENTS[r["event_code"]].name
            if r["event_code"] in rules.EVENTS
            else r["event_code"],
            "status": r["status"],
            "team_id": r.get("team_id"),
            "team_name": team_names.get(r.get("team_id") or "", None),
        }
        for r in regs
    ]

    # The public view, not the raw row: the participant code must not reach the
    # browser until the registration is confirmed (see registration_state.py).
    from services.registration_state import public_view

    return {
        "success": True,
        "participant": public_view(participant),
        "registrations": registrations,
        "counted_used": counted_used,
        "counted_max": rules.DEFAULT_CONFIG["max_counted_events"],
        "capacity": capacity,
        "catalog": rules.evaluate_catalog(
            payment_status=participant["payment_status"],
            existing=held,
            capacity_by_event=capacity,
        ),
        "pending_invites": pending_invites(user_id),
    }


def pending_invites(user_id: str) -> List[Dict[str, Any]]:
    """Teams awaiting this participant's Accept/Decline (D2). Used from Phase 5."""
    rows = db.select(
        "team_members",
        f"select=team_id,invited_at&user_id=eq.{user_id}&accept_status=eq.PENDING",
    )
    if not rows:
        return []

    joined = ",".join(r["team_id"] for r in rows)
    teams = {
        t["team_id"]: t
        for t in db.select(
            "teams",
            f"select=team_id,team_name,event_code,captain_user_id,status&team_id=in.({joined})",
        )
    }

    captain_ids = {t["captain_user_id"] for t in teams.values()}
    captains = {}
    if captain_ids:
        captains = {
            p["user_id"]: p["name"]
            for p in db.select(
                "participants",
                f"select=user_id,name&user_id=in.({','.join(captain_ids)})",
            )
        }

    invites = []
    for r in rows:
        team = teams.get(r["team_id"])
        if not team or team["status"] == "CANCELLED":
            continue
        invites.append(
            {
                "team_id": team["team_id"],
                "team_name": team["team_name"],
                "event_code": team["event_code"],
                "event_name": rules.EVENTS[team["event_code"]].name
                if team["event_code"] in rules.EVENTS
                else team["event_code"],
                "captain_user_id": team["captain_user_id"],
                "captain_name": captains.get(team["captain_user_id"], ""),
                "invited_at": r["invited_at"],
            }
        )
    return invites


# --- writes ----------------------------------------------------------------

def register_individual(user_id: str, event_code: str, confirm_warnings: bool = False) -> Dict[str, Any]:
    """
    POST /api/participant/events/register

    Individual events only (The Last Signal, Debugging, Lost in SQL). Team
    events go through the Phase 5 team flow — registering a team event here
    would bypass R10 and the acceptance requirement.
    """
    participant = db.select_one(
        "participants", f"select=user_id,name,email,payment_status,master_qr_token&user_id=eq.{user_id}"
    )
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Participant not found."}

    event = rules.EVENTS.get(event_code)
    if not event:
        return {"success": False, "error_code": "UNKNOWN_EVENT", "message": "Unknown event."}

    # min_team > 1 means a team is mandatory. Letting one through here would
    # create a CONFIRMED registration with no team row behind it, which skips
    # both R10 and the teammate acceptance in D2 — a one-person Borderland
    # entry that no coordinator would ever be able to explain.
    if event.min_team > 1:
        return {
            "success": False,
            "error_code": "TEAM_EVENT",
            "message": f"{event.name} needs a team of {event.min_team}"
                       f"{'' if event.min_team == event.max_team else f'-{event.max_team}'}"
                       f" — use the team registration flow.",
        }

    capacity = capacity_map()
    decision = rules.can_register(
        payment_status=participant["payment_status"],
        event_code=event_code,
        existing=held_event_codes(user_id),
        remaining_capacity=capacity.get(event_code),
    )

    if not decision.ok:
        return {
            "success": False,
            "error_code": decision.code,
            "rule": decision.rule,
            "message": decision.message,
        }

    # R15 — legal, but the participant has to be shown the warning and come back.
    if decision.warnings and not confirm_warnings:
        return {
            "success": False,
            "error_code": "CONFIRMATION_REQUIRED",
            "message": decision.warnings[0].message,
            "warnings": [w.message for w in decision.warnings],
        }

    reg_id = rpc_register(user_id, event_code)

    _send_confirmation(participant, event)

    return {
        "success": True,
        "reg_id": reg_id,
        "event_code": event_code,
        "message": f"You're registered for {event.name}.",
    }


def cancel_registration(user_id: str, event_code: str) -> Dict[str, Any]:
    """
    POST /api/participant/events/cancel

    Routed through can_cancel() so the R14 close date and the R7 orphan block
    both apply — including for team events, where only the captain may cancel.
    """
    event = rules.EVENTS.get(event_code)
    if not event:
        return {"success": False, "error_code": "UNKNOWN_EVENT", "message": "Unknown event."}

    reg = db.select_one(
        "registrations",
        f"select=reg_id,team_id,status&user_id=eq.{user_id}"
        f"&event_code=eq.{event_code}&status=neq.CANCELLED",
    )
    if not reg:
        return {
            "success": False,
            "error_code": "NOT_REGISTERED",
            "message": f"You are not registered for {event.name}.",
        }

    decision = rules.can_cancel(event_code=event_code, existing=held_event_codes(user_id))
    if not decision.ok:
        return {
            "success": False,
            "error_code": decision.code,
            "rule": decision.rule,
            "message": decision.message,
        }

    if reg.get("team_id"):
        team = db.select_one("teams", f"select=captain_user_id&team_id=eq.{reg['team_id']}")
        if team and team["captain_user_id"] != user_id:
            return {
                "success": False,
                "error_code": "NOT_CAPTAIN",
                "message": "Only the team captain can cancel this registration.",
            }

    # `moved` is how many rows actually reached CANCELLED. Reporting success on
    # a write that touched nothing is what made a cancellation look as though it
    # had only happened in the browser: the card vanished on reload while the
    # row stayed live in the database.
    moved = rpc_cancel(user_id, event_code, event.name)

    return {
        "success": True,
        "event_code": event_code,
        "cancelled": moved,
        "message": (
            f"{event.name} team cancelled for every member."
            if reg.get("team_id")
            else f"{event.name} cancelled. The seat has been returned."
        ),
    }


def rpc_cancel(user_id: str, event_code: str, event_name: str) -> int:
    """
    Transactional cancel via migration 013. Returns the number of registration
    rows that moved to CANCELLED.

    Deliberately not db.update(): the previous pair of PATCHes discarded their
    own responses, so a filter that matched nothing was indistinguishable from
    a successful cancel. A captain's cancel was worse — registrations and the
    teams row were two separate requests, so a failure between them left every
    member CANCELLED under a team still marked CONFIRMED. One function call is
    one transaction and reports what it did.
    """
    r = requests.post(
        f"{db.SUPABASE_URL}/rest/v1/rpc/cancel_participant_event",
        headers=db.write_headers(),
        json={"p_user_id": user_id, "p_event_code": event_code},
        timeout=db.TIMEOUT,
    )

    if r.status_code in (200, 201):
        value = r.json()
        if isinstance(value, list):
            value = value[0] if value else 0
        moved = int(value or 0)
        if moved == 0:
            raise Zin26Error(
                f"{event_name} was not cancelled — nothing changed in the database. "
                "Reload the page and try again.",
                status=409,
                code="CANCEL_FAILED",
            )
        return moved

    body = r.text or ""

    # PGRST202 is "no such function". Cancelling predates 013, so fall back
    # rather than withdraw the feature from a deployment that has the new code
    # but has not run the migration yet. What 013 really fixes is the index
    # that blocks re-registration; this path keeps working in the meantime.
    if "PGRST202" in body or r.status_code == 404:
        print(
            "[event_registration] zin26.cancel_participant_event is missing - "
            "apply supabase/migrations/013; falling back to PATCH"
        )
        return _cancel_by_patch(user_id, event_code, event_name)

    if "ZIN26_NOT_REGISTERED" in body:
        raise Zin26Error(
            f"You are not registered for {event_name}.", status=404, code="NOT_REGISTERED"
        )
    if "ZIN26_NOT_CAPTAIN" in body:
        raise Zin26Error(
            "Only the team captain can cancel this registration.",
            status=403,
            code="NOT_CAPTAIN",
        )
    raise Zin26Error(
        f"could not cancel - is migration 013 applied? HTTP {r.status_code} {body[:200]}"
    )


def _cancel_by_patch(user_id: str, event_code: str, event_name: str) -> int:
    """
    Pre-013 cancellation: read the live row, then PATCH it. Two round trips, so
    it is not atomic — the fallback, never the first choice.

    One captain's cancel unwinds the whole team, not just their own row: a team
    cancellation releases every member's seat and event count (R14/D7).
    """
    reg = db.select_one(
        "registrations",
        f"select=reg_id,team_id&user_id=eq.{user_id}"
        f"&event_code=eq.{event_code}&status=neq.CANCELLED",
    )
    if not reg:
        raise Zin26Error(
            f"You are not registered for {event_name}.", status=404, code="NOT_REGISTERED"
        )

    now = dt.datetime.now(dt.timezone.utc).isoformat()

    # status=neq.CANCELLED makes the PATCH a compare-and-set, so a second tap
    # updates nothing instead of overwriting cancelled_at with a later time.
    if reg.get("team_id"):
        rows = db.update(
            "registrations",
            f"team_id=eq.{reg['team_id']}&status=neq.CANCELLED",
            {"status": "CANCELLED", "cancelled_at": now},
        )
        db.update(
            "teams", f"team_id=eq.{reg['team_id']}", {"status": "CANCELLED", "updated_at": now}
        )
    else:
        rows = db.update(
            "registrations",
            f"reg_id=eq.{reg['reg_id']}&status=neq.CANCELLED",
            {"status": "CANCELLED", "cancelled_at": now},
        )

    if not rows:
        # The row was live a moment ago and is not now: another request got
        # there first. The seat is released either way, but say so rather than
        # claim this call did it.
        raise Zin26Error(
            f"{event_name} was already cancelled. Reload the page.",
            status=409,
            code="NOT_REGISTERED",
        )
    return len(rows)


def rpc_register(user_id: str, event_code: str, team_id: Optional[str] = None, status: str = "CONFIRMED") -> str:
    """
    Race-safe insert via migration 012/013. Translates the function's sentinel
    exceptions back into domain errors.
    """
    # Deliberately not db.insert(): the capacity check and the insert have to
    # happen under the same row lock. Doing it here in Python would leave the
    # window between "1 seat left" and INSERT open to a second request, which
    # is exactly the concurrency note in §5.
    r = requests.post(
        f"{db.SUPABASE_URL}/rest/v1/rpc/register_participant_event",
        headers=db.write_headers(),
        json={
            "p_user_id": user_id,
            "p_event_code": event_code,
            "p_team_id": team_id,
            "p_source": "ONLINE",
            "p_status": status,
        },
        timeout=db.TIMEOUT,
    )

    if r.status_code in (200, 201):
        value = r.json()
        if isinstance(value, list):
            value = value[0] if value else ""
        return str(value)

    body = r.text or ""
    if "ZIN26_EVENT_FULL" in body:
        raise Zin26Error("Event full", status=409, code="EVENT_FULL")
    if "ZIN26_ALREADY_REGISTERED" in body:
        raise Zin26Error("Already registered", status=409, code="ALREADY_REGISTERED")
    if "ZIN26_EVENT_UNKNOWN" in body:
        raise Zin26Error("Unknown event", status=404, code="UNKNOWN_EVENT")

    # 23505 is the unique index behind the function's own ALREADY_REGISTERED
    # check, reached when two requests race past the EXISTS. It used to fall
    # through to the message below, which showed the participant a raw Postgres
    # constraint violation and blamed a migration that was applied — the
    # symptom that hid the real defect (a CANCELLED row still held
    # (user_id, event_code), so no cancelled event could ever be re-entered).
    # 013 makes that index live-only; a 23505 now means a genuine duplicate.
    if "23505" in body:
        raise Zin26Error("Already registered", status=409, code="ALREADY_REGISTERED")

    raise Zin26Error(
        f"could not register - is migration 012 applied? HTTP {r.status_code} {body[:200]}"
    )


def _send_confirmation(participant: Dict[str, Any], event) -> None:
    """§4.5 confirmation email. Best-effort; a failure never loses the seat."""
    try:
        from services.email_service import send_simple_email

        send_simple_email(
            to=participant["email"],
            subject=f"Zinnia 2026 — you're registered for {event.name}",
            html=(
                f"<p>Hi {participant.get('name', '')},</p><p>You're confirmed for <strong>"
                f"{event.name}</strong>.</p><p>Your UserID is <strong>"
                f"{participant['user_id']}</strong>. Bring the master QR from your registration email — the same pass works at the gate, at every event desk and at the food counter.</p>"
            ),
        )

    except Exception as e:
        print(
            f"[event_registration] confirmation email failed for "
            f"{participant.get('user_id')} / {event.code}: {type(e).__name__}: {e}"
        )
