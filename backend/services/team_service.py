"""
Zinnia 2026 — Phase 5: team events (doc §4.3, R8-R10, D2).

Captain creates the team and names teammates by their UserID code. Every member
must independently pass R1-R7 (R8), and the team is only CONFIRMED once every
member has accepted (D2) — a captain cannot silently consume someone else's
3-event quota.

RESERVATION MODEL
-----------------
A registrations row is inserted for every member at team creation with status
PENDING_ACCEPTANCE, then flipped to CONFIRMED by zin26.confirm_team(). The row
is what holds the member's 3-event quota and the event's seat while
invitations are outstanding; deferring it to acceptance time would let two
captains each add the same person and both confirm past R1.

Declining or being swapped out cancels that member's reserved row, returning
their quota immediately.
"""

from __future__ import annotations

import datetime as dt
import secrets
from typing import Any, Dict, List, Optional

from services import event_registration_service as regs
from services import rules_engine as rules
from services import zin26_db as db
from services.participant_service import is_valid_user_id
from services.zin26_db import Zin26Error

# D2: silence for this long lets the captain swap a teammate out.
ACCEPT_TIMEOUT_HOURS = 24


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _iso(value: dt.datetime) -> str:
    return value.isoformat()


# --- lookup ----------------------------------------------------------------

def lookup_teammate(requester_id: str, user_id: str, event_code: str) -> Dict[str, Any]:
    """
    GET /api/participant/teams/lookup

    Live lookup behind the add-teammate field. Returns name + college for
    confirmation, plus the specific blocking reason if there is one, so the
    captain sees "already registered for this event" rather than a bare
    failure at submit time (§4.3).
    """
    user_id = (user_id or "").strip().upper()
    event = rules.EVENTS.get(event_code)

    if not event:
        return {"success": False, "error_code": "UNKNOWN_EVENT", "message": "Unknown event."}
    if not user_id:
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "Enter a UserID."}
    if not is_valid_user_id(user_id):
        return {
            "success": False,
            "error_code": "INVALID_USER_ID",
            "message": "That UserID does not look right — check the spelling.",
        }

    participant = db.select_one(
        "participants",
        f"select=user_id,name,college,payment_status&user_id=eq.{user_id}",
    )
    if not participant:
        return {
            "success": False,
            "error_code": "NOT_FOUND",
            "message": f"No participant with UserID {user_id}.",
        }

    if user_id == requester_id:
        return {
            "success": True,
            "user_id": user_id,
            "name": participant["name"],
            "college": participant["college"],
            "blocked_reason": "You are already the captain of this team.",
            "blocked_rule": "R9",
        }

    held = regs.held_event_codes(user_id)
    capacity = regs.capacity_map()

    decision = rules.can_register(
        payment_status=participant["payment_status"],
        event_code=event_code,
        existing=held,
        remaining_capacity=capacity.get(event_code),
    )

    return {
        "success": True,
        "user_id": user_id,
        "name": participant["name"],
        "college": participant["college"],
        "blocked_reason": None if decision.ok else decision.message,
        "blocked_rule": None if decision.ok else decision.rule,
    }


# --- create ----------------------------------------------------------------

def create_team(
    captain_id: str,
    event_code: str,
    team_name: str,
    member_user_ids: List[str],
    confirm_warnings: bool = False,
    topic: str = "",
) -> Dict[str, Any]:
    """POST /api/participant/teams/create"""
    event = rules.EVENTS.get(event_code)
    if not event:
        return {"success": False, "error_code": "UNKNOWN_EVENT", "message": "Unknown event."}
    if event.max_team <= 1:
        return {
            "success": False,
            "error_code": "NOT_A_TEAM_EVENT",
            "message": f"{event.name} is an individual event.",
        }

    team_name = (team_name or "").strip()
    if not team_name:
        return {"success": False, "error_code": "VALIDATION_ERROR", "field": "team_name",
                "message": "Give your team a name."}

    # Only the events that actually let a team choose. Anything sent for another
    # event is dropped rather than stored, so a stray field cannot put a topic
    # on a team that has no such thing.
    topic = (topic or "").strip() if event_code in rules.TOPIC_EVENTS else ""
    if event_code in rules.TOPIC_EVENTS:
        if not topic:
            return {"success": False, "error_code": "VALIDATION_ERROR", "field": "topic",
                    "message": "Tell us the topic your team will present."}
        if len(topic) > rules.TOPIC_MAX_LEN:
            return {"success": False, "error_code": "VALIDATION_ERROR", "field": "topic",
                    "message": f"Keep the topic under {rules.TOPIC_MAX_LEN} characters."}

    # Captain first, then teammates, de-duplicated — a captain who also types
    # their own code into a teammate field should not fail R9 for it.
    ids = [captain_id]
    for raw in member_user_ids or []:
        uid = (raw or "").strip().upper()
        if uid and uid not in ids:
            ids.append(uid)

    participants = _load_participants(ids)
    missing = [uid for uid in ids if uid not in participants]
    if missing:
        return {
            "success": False,
            "error_code": "NOT_FOUND",
            "message": f"No participant with UserID {missing[0]}.",
            "user_id": missing[0],
        }

    capacity = regs.capacity_map()
    members_for_rules = [
        {
            "user_id": uid,
            "payment_status": participants[uid]["payment_status"],
            "existing": regs.held_event_codes(uid),
        }
        for uid in ids
    ]

    decision = rules.can_register_team(
        event_code=event_code,
        members=members_for_rules,
        remaining_capacity=capacity.get(event_code),
    )
    if not decision.ok:
        return {
            "success": False,
            "error_code": decision.code,
            "rule": decision.rule,
            "message": decision.message,
            "user_id": decision.user_id or None,
        }

    if decision.warnings and not confirm_warnings:
        return {
            "success": False,
            "error_code": "CONFIRMATION_REQUIRED",
            "message": decision.warnings[0].message,
            "warnings": [w.message for w in decision.warnings],
        }

    # Team row first: everything below needs its team_id.
    team_rows = _insert_team(event_code, team_name, captain_id, topic)
    if not team_rows:
        raise Zin26Error("team insert returned nothing")
    team_id = team_rows[0]["team_id"]

    try:
        db.insert(
            "team_members",
            [
                {
                    "team_id": team_id,
                    "user_id": uid,
                    "role": "CAPTAIN" if uid == captain_id else "MEMBER",
                    # The captain has implicitly accepted by creating the team.
                    "accept_status": "ACCEPTED" if uid == captain_id else "PENDING",
                    "responded_at": _iso(_now()) if uid == captain_id else None,
                }
                for uid in ids
            ],
        )

        # Reserve the seat and the quota now, not at acceptance — see the header.
        for uid in ids:
            regs.rpc_register(uid, event_code, team_id=team_id, status="PENDING_ACCEPTANCE")
    except Zin26Error:
        # A half-built team would hold seats nobody can release, so it goes.
        _hard_delete_team(team_id)
        raise

    # No invite mail. The ONLY mail this flow sends is the one the participant
    # asks for by pressing Confirm on their dashboard; anything sent before
    # that is an event-by-event notification through the side door, which is
    # exactly what Confirm exists to replace. A teammate sees the invitation on
    # their own dashboard, under "Team invitations".
    return {"success": True, **_team_view(team_id)}


# --- accept / decline ------------------------------------------------------

def respond_to_invite(user_id: str, team_id: str, accept: bool) -> Dict[str, Any]:
    """POST /api/participant/teams/respond"""
    membership = db.select_one(
        "team_members", f"select=*&team_id=eq.{team_id}&user_id=eq.{user_id}"
    )
    if not membership:
        return {"success": False, "error_code": "NOT_FOUND", "message": "No invitation for you on that team."}

    team = db.select_one("teams", f"select=*&team_id=eq.{team_id}")
    if not team or team["status"] == "CANCELLED":
        return {"success": False, "error_code": "TEAM_CANCELLED", "message": "That team no longer exists."}

    if membership["accept_status"] != "PENDING":
        return {
            "success": False,
            "error_code": "ALREADY_RESPONDED",
            "message": f"You already {membership['accept_status'].lower()} this invitation.",
        }

    now = _now()
    db.update(
        "team_members",
        f"team_id=eq.{team_id}&user_id=eq.{user_id}",
        {"accept_status": "ACCEPTED" if accept else "DECLINED", "responded_at": _iso(now)},
    )

    if not accept:
        # Release this member's reserved row immediately; the rest of the team
        # keeps theirs while the captain finds a replacement.
        db.update(
            "registrations",
            f"team_id=eq.{team_id}&user_id=eq.{user_id}&status=neq.CANCELLED",
            {"status": "CANCELLED", "cancelled_at": _iso(now)},
        )
        return {
            "success": True,
            "team_id": team_id,
            "status": "DECLINED",
            "message": "Invitation declined. The captain can pick someone else.",
        }

    outstanding = db.count(
        "team_members", f"select=user_id&team_id=eq.{team_id}&accept_status=neq.ACCEPTED"
    )
    if outstanding == 0:
        confirmed = _rpc_confirm_team(team_id)
        # No mail here. A team confirming is a registration completing, and
        # registrations no longer email on their own - the participant presses
        # Confirm on the dashboard when their line-up is final, and that one
        # press sends the list. Mailing here as well would put an event-by-event
        # confirmation back into the flow through the side door.
        #
        # Nor does the invite: a teammate is told there is something to accept
        # by the invitation panel on their own dashboard, not by email.
        return {
            "success": True,
            "team_id": team_id,
            "status": "CONFIRMED",
            "message": f"Everyone accepted — your team is confirmed ({confirmed} members).",
        }

    return {
        "success": True,
        "team_id": team_id,
        "status": "PENDING_ACCEPTANCE",
        "message": f"Accepted. Waiting on {outstanding} more teammate"
                   f"{'s' if outstanding != 1 else ''}.",
    }


# --- swap ------------------------------------------------------------------

def swap_member(captain_id: str, team_id: str, out_user_id: str, in_user_id: str) -> Dict[str, Any]:
    """
    POST /api/participant/teams/swap

    Allowed when the outgoing member declined, or has been silent past the
    24-hour timeout (D2). Anything else would let a captain quietly drop
    someone who had already accepted.
    """
    out_user_id = (out_user_id or "").strip().upper()
    in_user_id = (in_user_id or "").strip().upper()

    team = db.select_one("teams", f"select=*&team_id=eq.{team_id}")
    if not team:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Team not found."}
    if team["captain_user_id"] != captain_id:
        return {"success": False, "error_code": "NOT_CAPTAIN", "message": "Only the captain can change the team."}
    if team["status"] == "CANCELLED":
        return {"success": False, "error_code": "TEAM_CANCELLED", "message": "That team no longer exists."}

    event = rules.EVENTS[team["event_code"]]

    outgoing = db.select_one(
        "team_members", f"select=*&team_id=eq.{team_id}&user_id=eq.{out_user_id}"
    )
    if not outgoing:
        return {"success": False, "error_code": "NOT_FOUND", "message": f"{out_user_id} is not on this team."}
    if outgoing["role"] == "CAPTAIN":
        return {"success": False, "error_code": "CANNOT_SWAP_CAPTAIN",
                "message": "The captain cannot be swapped out. Cancel the team instead."}

    invited_at = dt.datetime.fromisoformat(outgoing["invited_at"])
    timed_out = (_now() - invited_at).total_seconds() >= ACCEPT_TIMEOUT_HOURS * 3600

    if outgoing["accept_status"] == "ACCEPTED":
        return {
            "success": False,
            "error_code": "ALREADY_ACCEPTED",
            "message": f"{out_user_id} has already accepted and cannot be swapped out.",
        }
    if outgoing["accept_status"] == "PENDING" and not timed_out:
        return {
            "success": False,
            "error_code": "STILL_WAITING",
            "message": f"{out_user_id} still has time to respond. You can swap them out "
                       f"{ACCEPT_TIMEOUT_HOURS}h after the invitation.",
        }

    incoming = db.select_one(
        "participants", f"select=user_id,name,college,email,payment_status&user_id=eq.{in_user_id}"
    )
    if not incoming:
        return {"success": False, "error_code": "NOT_FOUND", "message": f"No participant with UserID {in_user_id}."}

    existing_member = db.select_one(
        "team_members", f"select=user_id&team_id=eq.{team_id}&user_id=eq.{in_user_id}"
    )
    if existing_member:
        return {"success": False, "error_code": "DUPLICATE_MEMBER",
                "message": f"{in_user_id} is already on this team."}

    decision = rules.can_register(
        payment_status=incoming["payment_status"],
        event_code=team["event_code"],
        existing=regs.held_event_codes(in_user_id),
        remaining_capacity=regs.capacity_map().get(team["event_code"]),
    )
    if not decision.ok:
        return {
            "success": False,
            "error_code": decision.code,
            "rule": decision.rule,
            "message": f"{in_user_id}: {decision.message}",
            "user_id": in_user_id,
        }

    now = _now()
    db.update(
        "registrations",
        f"team_id=eq.{team_id}&user_id=eq.{out_user_id}&status=neq.CANCELLED",
        {"status": "CANCELLED", "cancelled_at": _iso(now)},
    )
    db.delete("team_members", f"team_id=eq.{team_id}&user_id=eq.{out_user_id}")

    db.insert(
        "team_members",
        {
            "team_id": team_id,
            "user_id": in_user_id,
            "role": "MEMBER",
            "accept_status": "PENDING",
        },
    )
    regs.rpc_register(in_user_id, team["event_code"], team_id=team_id, status="PENDING_ACCEPTANCE")

    # No mail here either — the replacement teammate sees the invitation on
    # their dashboard, same as any other invite.
    return {"success": True, **_team_view(team_id)}


# --- read / cancel ---------------------------------------------------------

def my_teams(user_id: str) -> Dict[str, Any]:
    """GET /api/participant/teams/mine"""
    memberships = db.select("team_members", f"select=team_id&user_id=eq.{user_id}")
    team_ids = [m["team_id"] for m in memberships]

    teams = []
    if team_ids:
        joined = ",".join(team_ids)
        rows = db.select("teams", f"select=team_id&team_id=in.({joined})&status=neq.CANCELLED")
        teams = [_team_view(r["team_id"]) for r in rows]

    return {"success": True, "teams": teams, "invites": regs.pending_invites(user_id)}


def cancel_team(captain_id: str, team_id: str) -> Dict[str, Any]:
    """
    POST /api/participant/teams/cancel

    Routed through can_cancel() so R14's close date and the R7 orphan guard
    apply to team events exactly as they do to individual ones — cancelling a
    team that is someone's only on-campus event must not orphan their Short
    Film registration.
    """
    team = db.select_one("teams", f"select=*&team_id=eq.{team_id}")
    if not team:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Team not found."}
    if team["captain_user_id"] != captain_id:
        return {"success": False, "error_code": "NOT_CAPTAIN", "message": "Only the captain can cancel the team."}
    if team["status"] == "CANCELLED":
        return {"success": False, "error_code": "TEAM_CANCELLED", "message": "That team is already cancelled."}

    event_code = team["event_code"]
    members = db.select("team_members", f"select=user_id&team_id=eq.{team_id}")

    for m in members:
        decision = rules.can_cancel(
            event_code=event_code, existing=regs.held_event_codes(m["user_id"])
        )
        if decision.ok: continue
        return {
            "success": False,
            "error_code": decision.code,
            "rule": decision.rule,
            "message": f"{m['user_id']}: {decision.message}",
            "user_id": m["user_id"],
        }

    now = _now()
    db.update(
        "registrations",
        f"team_id=eq.{team_id}&status=neq.CANCELLED",
        {"status": "CANCELLED", "cancelled_at": _iso(now)},
    )
    db.update("teams", f"team_id=eq.{team_id}", {"status": "CANCELLED", "updated_at": _iso(now)})

    return {
        "success": True,
        "team_id": team_id,
        "message": f"{rules.EVENTS[event_code].name} team cancelled for every member.",
    }


# --- internals -------------------------------------------------------------

def _load_participants(ids: List[str]) -> Dict[str, Dict[str, Any]]:
    if not ids:
        return {}
    joined = ",".join(ids)
    rows = db.select(
        "participants",
        f"select=user_id,name,college,email,payment_status&user_id=in.({joined})",
    )
    return {r["user_id"]: r for r in rows}


def _team_view(team_id: str) -> Dict[str, Any]:
    team = db.select_one("teams", f"select=*&team_id=eq.{team_id}")
    if not team:
        raise Zin26Error("team disappeared", status=404, code="NOT_FOUND")

    rows = db.select("team_members", f"select=*&team_id=eq.{team_id}")
    people = _load_participants([r["user_id"] for r in rows])

    event = rules.EVENTS.get(team["event_code"])

    return {
        "team_id": team["team_id"],
        "team_name": team["team_name"],
        "event_code": team["event_code"],
        "event_name": event.name if event else team["event_code"],
        "status": team["status"],
        "captain_user_id": team["captain_user_id"],
        "topic": team.get("topic"),
        "created_at": team["created_at"],
        "members": [
            {
                "user_id": r["user_id"],
                "name": people.get(r["user_id"], {}).get("name", ""),
                "college": people.get(r["user_id"], {}).get("college", ""),
                "role": r["role"],
                "accept_status": r["accept_status"],
                "invited_at": r["invited_at"],
            }
            for r in rows
        ],
    }


def _hard_delete_team(team_id: str) -> None:
    """Roll back a partially created team. Only ever called before anyone accepts."""
    try:
        db.delete("registrations", f"team_id=eq.{team_id}")
        db.delete("team_members", f"team_id=eq.{team_id}")
        db.delete("teams", f"team_id=eq.{team_id}")
    except Exception as e:
        print(f"[team_service] cleanup of half-built team {team_id} failed: {e}")


def _rpc_confirm_team(team_id: str) -> int:
    import requests

    r = requests.post(
        f"{db.SUPABASE_URL}/rest/v1/rpc/confirm_team",
        headers=db.write_headers(),
        json={"p_team_id": team_id},
        timeout=db.TIMEOUT,
    )
    if r.status_code in (200, 201):
        value = r.json()
        if isinstance(value, list):
            value = value[0] if value else 0
        return int(value or 0)

    body = r.text or ""
    if "ZIN26_TEAM_NOT_READY" in body:
        raise Zin26Error("Not every member has accepted yet.", status=409, code="TEAM_NOT_READY")
    if "ZIN26_TEAM_UNKNOWN" in body:
        raise Zin26Error("Team not found.", status=404, code="NOT_FOUND")
    raise Zin26Error(
        f"could not confirm team - is migration 012 applied? HTTP {r.status_code} {body[:200]}"
    )


# --- team ids ---------------------------------------------------------------
#
# ZIN26-PP0001: the event in two letters, then four digits. zin26.teams.team_id
# is a plain TEXT primary key with no default and no sequence, so the value has
# to be supplied on insert - it was not, which is why every team creation failed
# with a not-null violation and the table sat empty.

TEAM_ID_PREFIX = {
    "PAPER_PRESENTATION": "PP",
    "GADGET_CODES": "GC",
    "BORDERLAND": "BL",
    "THINK_STRIKE_WIN": "TS",
    "PLOT_TWIST": "PT",
}

# Attempts before giving up. With ~30 teams against 9999 numbers a first-pick
# collision is under 0.5%, so this only ever runs twice in practice.
_TEAM_ID_ATTEMPTS = 8


def _new_team_id(event_code: str) -> str:
    """
    Random four digits, never sequential.

    Sequential ids leak how many teams have registered and let anyone holding
    one guess its neighbours - and a team id is what a captain shares with
    teammates, so it travels. secrets, not random, for the same reason.
    """
    prefix = TEAM_ID_PREFIX.get(event_code, event_code[:2].upper())
    return f"ZIN26-{prefix}{secrets.randbelow(9999) + 1:04d}"


def _insert_team(
    event_code: str, team_name: str, captain_id: str, topic: str = ""
) -> List[Dict[str, Any]]:
    """Insert the team row, re-rolling the id if that number is already taken."""
    last: Optional[Exception] = None
    for _ in range(_TEAM_ID_ATTEMPTS):
        try:
            return db.insert(
                "teams",
                {
                    "team_id": _new_team_id(event_code),
                    "event_code": event_code,
                    "team_name": team_name,
                    "captain_user_id": captain_id,
                    "status": "PENDING_ACCEPTANCE",
                    # Omitted rather than written empty, so a team with no topic
                    # reads as NULL like every team created before the column.
                    **({"topic": topic} if topic else {}),
                },
            )
        except Zin26Error as e:
            # Only a primary-key clash is worth retrying; anything else is a
            # real failure and re-rolling the id would just hide it.
            if e.code != "DUPLICATE":
                raise
            last = e
    raise Zin26Error(
        f"could not allocate a team id for {event_code} after {_TEAM_ID_ATTEMPTS} attempts"
    ) from last


def _send_invite(member: Dict[str, Any], captain: Dict[str, Any], team_name: str, event) -> None:
    """
    NOT CALLED. Kept for the day invite mail is wanted again.

    Nothing in this flow emails before the participant presses Confirm on
    their dashboard — that press is the only thing that sends mail. The
    invitation reaches a teammate through the panel on their dashboard.
    """
    try:
        from services.email_service import send_simple_email

        send_simple_email(
            to=member.get("email", ""),
            subject=f"Zinnia 2026 — {captain.get('name', 'A teammate')} added you to {team_name}",
            html=(
                f"<p>Hi {member.get('name', '')},</p><p><strong>"
                f"{captain.get('name', 'A teammate')}</strong> has added you to the team <strong>"
                f"{team_name}</strong> for <strong>{event.name}</strong>.</p><p>Log in and accept or decline — the team is not registered until everyone has accepted. If you do nothing for "
                f"{ACCEPT_TIMEOUT_HOURS} hours the captain can replace you.</p>"
            ),
        )

    except Exception as e:
        print(f"[team_service] invite email failed for {member.get('user_id')}: {e}")


def _notify_confirmed(team_id: str) -> None:
    """
    Every member gets the roster once the team is complete.

    NOT CALLED. Kept because it is the natural place to mail a team roster if
    that is ever wanted again; today the only registration mail is the one the
    participant asks for with Confirm on the dashboard.
    """
    try:
        from services.email_service import send_simple_email

        view = _team_view(team_id)
        people = _load_participants([m["user_id"] for m in view["members"]])
        roster = ", ".join(f"{m['name']} ({m['user_id']})" for m in view["members"])

        for m in view["members"]:
            person = people.get(m["user_id"], {})
            send_simple_email(
                to=person.get("email", ""),
                subject=f"Zinnia 2026 — {view['team_name']} is confirmed for {view['event_name']}",
                html=(
                    f"<p>Hi {person.get('name', '')},</p><p>Your team <strong>"
                    f"{view['team_name']}</strong> is confirmed for <strong>"
                    f"{view['event_name']}</strong>.</p><p>Team: "
                    f"{roster}</p><p>Bring the master QR from your registration email — the same pass works at the gate, at every event desk and at the food counter.</p>"
                ),
            )

    except Exception as e:
        print(f"[team_service] confirmation emails failed for team {team_id}: {e}")
