"""
Zinnia 2026 — on-spot registration desk (admin panel).

Walk-ins on the fest day. The website's registration closes at 9:00 PM on
23 September (rules_engine._CLOSES_DEFAULT and zin26.events.reg_closes_at).
This desk is the one path that keeps registering after that, and only through
an authenticated TREASURER, SUPER_ADMIN or desk-only SPOT_DESK session - the
website stays closed.

NO DATABASE MIGRATION. Everything below uses columns and values zin26 already
has. What differs from the online flow, and why:

  * No email OTP. The desk types the address with the participant standing
    there, and the pass is shown on the desk screen as well as emailed, so a
    typo costs the email, not the registration.

  * The fee is paid at the desk (cash or UPI), so the payment is written
    APPROVED at ON_SPOT_FEE and the pass (EMAIL #2) goes out straight after
    (send_pass, called by the desk once the person's panel is open).
    payments.approval_note starts with SPOT_NOTE_PREFIX. That prefix is how the
    treasurer's queue tells a desk payment from an online one - no new column.

  * Close dates are lifted for on-campus events (rules_engine's
    ignore_close_date). Every other rule still applies: duplicates, the
    3-event cap, time clashes, team sizes and capacity. An event an admin has
    closed on the Events page (is_active = false) stays closed here too.

  * Teams are created CONFIRMED. Everyone is at the desk, so there is no
    invitation to accept.

  * Registrations carry source = 'SPOT'.
"""

from __future__ import annotations

import datetime as dt
import os
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, List, Optional

from services import event_registration_service as regs
from services import rules_engine as rules
from services import team_service as teams
from services import zin26_db as db
from services.audit_service import log_action
from services.participant_service import EMAIL_RE, is_valid_user_id
from services.zin26_db import Zin26Error

ON_SPOT_FEE = int(os.getenv("ON_SPOT_REGISTRATION_FEE", "300"))

# Written at the start of payments.approval_note for every desk payment.
SPOT_NOTE_PREFIX = "ON-SPOT"

PAYMENT_METHODS = {"CASH": "Cash", "UPI": "UPI"}

# The exact note the desk writes (see register_participant), matched exactly and
# case-sensitively. approval_note is also where a treasurer types a free-text
# Bypass reason, and a reason like "On-spot cash, desk 2" must stay a BYPASS -
# a loose prefix match hid those from the Bypassed filter at reconciliation.
_SPOT_NOTE_RE = re.compile(
    rf"^{re.escape(SPOT_NOTE_PREFIX)} \| ({'|'.join(PAYMENT_METHODS.values())}) \| collected by "
)

PARTICIPANT_FIELDS = (
    "user_id,name,email,phone,college,department,year,food_preference,"
    "payment_status,master_qr_token,created_at"
)


def is_spot_note(note: Any) -> bool:
    """True for a payment recorded at the on-spot desk."""
    return bool(_SPOT_NOTE_RE.match(str(note or "")))


def _together(calls: Dict[str, Callable[[], Any]]) -> Dict[str, Any]:
    """
    Run independent database reads side by side and return their results by
    name. Each read is a round trip to Supabase, so a screen that needs five
    of them waits for the slowest one instead of the sum of all five. An
    exception from any read is raised here, as it would be if run in turn.
    """
    if not calls:
        return {}
    with ThreadPoolExecutor(max_workers=len(calls)) as pool:
        futures = {name: pool.submit(fn) for name, fn in calls.items()}
        return {name: future.result() for name, future in futures.items()}


def _utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _now_iso() -> str:
    return _utcnow().isoformat()


def _fail(code: str, message: str, **extra: Any) -> Dict[str, Any]:
    return {"success": False, "error_code": code, "message": message, **extra}


def _normalise_user_id(user_id: Any) -> str:
    return str(user_id or "").strip().upper()


def _participant(user_id: str) -> Optional[Dict[str, Any]]:
    return db.select_one("participants", f"select={PARTICIPANT_FIELDS}&user_id=eq.{db.enc(user_id)}")


EVENT_FIELDS = "code,name,is_active,capacity,max_team,reg_closes_at"


def _event_row(event_code: str) -> Optional[Dict[str, Any]]:
    return db.select_one("events", f"select={EVENT_FIELDS}&code=eq.{db.enc(event_code)}")


def _closed_by_admin(event: Optional[Dict[str, Any]]) -> bool:
    """
    The rule engine's catalogue hardcodes is_active=True, and the database
    function that normally enforces zin26.events.is_active is not always on
    this path (see _claim_seat), so the flag is read here.
    """
    return bool(event) and event.get("is_active") is False


def _live_rows(event_code: str, fields: str) -> List[Dict[str, Any]]:
    return db.select(
        "registrations",
        f"select={fields}&event_code=eq.{db.enc(event_code)}&status=neq.CANCELLED&order=reg_id.asc",
    )


def _remaining_seats(event: Optional[Dict[str, Any]]) -> Optional[int]:
    """
    Seats left for ONE event, counted the way register_participant_event counts:
    distinct teams for a team event, heads otherwise. None means uncapped.

    Scoped to the event on purpose. capacity_map() reads every live registration
    in one unpaginated request, and past PostgREST's row cap it undercounts in
    silence - harmless for a dashboard card, not for the only capacity check
    left once the database function has stopped accepting.
    """
    if not event or event.get("capacity") is None:
        return None
    if (event.get("max_team") or 1) > 1:
        rows = _live_rows(event["code"], "team_id")
        used = len({r["team_id"] for r in rows if r.get("team_id")}) + sum(1 for r in rows if not r.get("team_id"))
    else:
        used = len(_live_rows(event["code"], "reg_id"))
    return max(int(event["capacity"]) - used, 0)


def _within_capacity(event: Dict[str, Any], reg_id: Any, team_id: Optional[str]) -> bool:
    """
    After an unlocked insert: is this row among the first `capacity` claims?

    Two desks can both see the last seat free and both insert. Ranking every
    live claim by reg_id (an identity, so insertion order) gives both the same
    answer, and exactly the later one finds itself past the cap and backs out.
    """
    cap = event.get("capacity")
    if cap is None:
        return True
    if (event.get("max_team") or 1) > 1:
        order: List[str] = []
        for r in _live_rows(event["code"], "reg_id,team_id"):
            key = r.get("team_id") or f"reg:{r['reg_id']}"
            if key not in order:
                order.append(key)
        mine = team_id or f"reg:{reg_id}"
    else:
        order = [str(r["reg_id"]) for r in _live_rows(event["code"], "reg_id")]
        mine = str(reg_id)
    return mine in order and order.index(mine) < int(cap)


def _person_view(p: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": p.get("user_id"),
        "name": p.get("name"),
        "email": p.get("email"),
        "phone": p.get("phone"),
        "college": p.get("college"),
        "department": p.get("department"),
        "year": p.get("year"),
        "food_preference": p.get("food_preference"),
        "payment_status": p.get("payment_status"),
        "created_at": p.get("created_at"),
    }


def _decision_error(decision: rules.Decision) -> Dict[str, Any]:
    return _fail(
        decision.code,
        decision.message,
        rule=decision.rule,
        **({"user_id": decision.user_id} if decision.user_id else {}),
    )


def _send_pass(participant: Dict[str, Any], on_spot: bool = True) -> bool:
    """EMAIL #2 - UserID, master QR, WhatsApp link. Desk wording unless on_spot=False. Never fatal."""
    try:
        from services.email_service import send_master_qr_email

        return bool((send_master_qr_email(participant, on_spot=on_spot) or {}).get("success"))
    except Exception as e:
        print(f"[spot] pass email failed for {participant.get('user_id')}: {type(e).__name__}: {e}")
        return False


# --- new walk-in ---------------------------------------------------------------

# --- the desk's own UPI accounts -------------------------------------------------
#
# Walk-ins pay into accounts of the desk's own, NEVER the website's
# (TREASURER_UPI_ID / TREASURER_UPI_ID_2 belong to online registration only).
# Each account is tied to one desk login in the environment:
#
#   SPOT_DESK_1_UPI_ID=...        SPOT_DESK_1_ADMIN=onspot1
#   SPOT_DESK_2_UPI_ID=...        SPOT_DESK_2_ADMIN=onspot2
#   ... one pair per desk, up to SPOT_DESK_9 (onspot3, onspot4 ...)
#   SPOT_DESK_n_PAYEE_NAME        optional, shown in the payer's UPI app
#
# A desk login always takes UPI into its own account. Any other login allowed
# on the desk (treasurer, super admin) picks one of them. The desk shows the
# account BEFORE the participant exists, so its key comes back with the
# registration and is checked against what this login may use.

DESK_SLOTS = tuple(range(1, 10))  # SPOT_DESK_1 ... SPOT_DESK_9; unset slots are skipped

# Roles that may use the desk and nothing else; see middleware DESK_ONLY_ROLES.
DESK_ROLE = "SPOT_DESK"


def desk_upi_accounts() -> List[Dict[str, str]]:
    """
    Every configured desk account. Read on each call, so a changed env needs no
    restart in tests.

    A slot set to one of the website's accounts, or to the same account as an
    earlier slot, is ignored - that login takes cash only - rather than let desk
    money land in a website account or be counted under two desks.
    """
    from services import pending_registration as pending

    # Every website account with an ID set - the third one included even while it
    # is switched off, so it can never quietly become a desk account.
    website = {str(a.get("upi_id") or "").strip().lower() for a in pending.known_accounts()}
    website.discard("")
    seen: set = set()
    accounts = []
    for n in DESK_SLOTS:
        upi = os.getenv(f"SPOT_DESK_{n}_UPI_ID", "").strip()
        if not upi:
            continue
        if upi.lower() in website:
            print(f"[spot] SPOT_DESK_{n}_UPI_ID is one of the website's UPI accounts - ignored, "
                  f"desk {n} takes cash only")
            continue
        if upi.lower() in seen:
            print(f"[spot] SPOT_DESK_{n}_UPI_ID repeats another desk's account - ignored")
            continue
        seen.add(upi.lower())
        accounts.append({
            "key": f"D{n}",
            "label": f"Desk {n}",
            "upi_id": upi,
            "admin": os.getenv(f"SPOT_DESK_{n}_ADMIN", "").strip().lower(),
            "payee_name": os.getenv(f"SPOT_DESK_{n}_PAYEE_NAME", "").strip() or "ZINNIA 2026",
        })
    return accounts


def desk_account_by_upi(upi: Any) -> Optional[Dict[str, str]]:
    """The desk account a recorded payee_upi belongs to, for the Payments page's Bank column."""
    wanted = str(upi or "").strip().lower()
    return next((a for a in desk_upi_accounts() if a["upi_id"].lower() == wanted), None) if wanted else None


def _upi_choices(admin: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    The accounts this login may take a UPI payment into.

    A login named in SPOT_DESK_n_ADMIN gets exactly its own account. A desk-only
    login with no account of its own gets none - it takes cash. Anyone else
    allowed on the desk may use either account.
    """
    accounts = desk_upi_accounts()
    username = str(admin.get("username") or "").strip().lower()
    own = [a for a in accounts if a["admin"] and a["admin"] == username]
    if own:
        return own[:1]
    if str(admin.get("role") or "").upper() == DESK_ROLE:
        return []
    return accounts


def _public_account(a: Dict[str, str]) -> Dict[str, str]:
    return {k: a[k] for k in ("key", "label", "upi_id", "payee_name")}


def desk_payee(admin: Dict[str, Any]) -> Dict[str, Any]:
    """
    GET /api/admin/spot/payee

    The UPI account(s) this login may show a QR for. `fixed` means the login is
    tied to one account; otherwise the desk offers a choice between them.
    """
    choices = _upi_choices(admin)
    if not choices:
        if str(admin.get("role") or "").upper() == DESK_ROLE:
            who = admin.get("username") or "this"
            return _fail("PAYEE_NOT_CONFIGURED",
                         f"No UPI account is set for the {who} login. Take cash, or set its "
                         f"SPOT_DESK_n_UPI_ID and SPOT_DESK_n_ADMIN on the server.")
        return _fail("PAYEE_NOT_CONFIGURED",
                     "No on-spot UPI account is set. Take cash, or set SPOT_DESK_1_UPI_ID on the server.")
    username = str(admin.get("username") or "").strip().lower()
    return {
        "success": True,
        "fixed": len(choices) == 1 and choices[0]["admin"] == username,
        "accounts": [_public_account(a) for a in choices],
        "amount": ON_SPOT_FEE,
    }


def check_email(email: str) -> Dict[str, Any]:
    """
    GET /api/admin/spot/check-email?email=

    Whether an address already belongs to a participant, so the walk-in form can
    say so the moment the email field is left - not after the whole form has been
    filled in and submitted. register_participant still refuses a duplicate on its
    own; this only brings the answer forward.
    """
    address = (email or "").strip().lower()
    if not EMAIL_RE.match(address):
        return _fail("VALIDATION_ERROR", "Enter a valid email address.", field="email")
    row = db.select_one("participants", f"select=user_id,name&email=eq.{db.enc(address)}")
    return {
        "success": True,
        "email": address,
        "registered": bool(row),
        "user_id": row["user_id"] if row else None,
        "name": row.get("name", "") if row else None,
    }


def register_participant(data: Dict[str, Any], admin: Dict[str, Any]) -> Dict[str, Any]:
    """
    POST /api/admin/spot/participants

    Creates the participant and an APPROVED payment in one go, then emails the
    pass. Validation runs before any write, so a refused request leaves the
    database untouched.
    """
    from services.participant_service import _next_user_id, _validate_details

    invalid = _validate_details(data)
    if invalid:
        return invalid

    method = str(data.get("payment_method") or "").strip().upper()
    if method not in PAYMENT_METHODS:
        return _fail("VALIDATION_ERROR", "Choose how the fee was paid: Cash or UPI.", field="payment_method")

    # No UTR is taken at the desk. The treasurer checks the payment by eye - the
    # cash in hand, or the UPI success screen on the payer's phone - and ticks
    # "received"; most payers cannot find their UTR quickly enough for a queue.
    payee_upi = ""
    if method == "UPI":
        # Record the account the desk SHOWED, sent back as payee_key - and only
        # if this login may take money into it: a desk login into its own
        # account, anyone else into either desk account. Never a website account.
        payee_key = str(data.get("payee_key") or "").strip().upper()
        account = next((a for a in _upi_choices(admin) if a["key"] == payee_key), None)
        if not account:
            return _fail(
                "VALIDATION_ERROR",
                "That UPI account cannot take payments at this login. Reload the QR and take the "
                "payment again, or take cash.",
                field="payment_method",
            )
        payee_upi = account["upi_id"]

    email = str(data["email"]).strip().lower()
    phone = re.sub(r"\D", "", str(data["phone"]))

    # The duplicate check and the UserID allocation are independent round trips,
    # so they run side by side: one wait instead of two on every walk-in. A
    # duplicate then leaves one serial unused - a harmless gap, and a rare one,
    # since the desk checks the email as soon as it is typed (check_email).
    first = _together({
        "existing": lambda: db.select_one("participants", f"select=user_id,name&email=eq.{db.enc(email)}"),
        "user_id": _next_user_id,
    })
    existing = first["existing"]
    if existing:
        # The desk is an authenticated treasurer session, so naming the UserID
        # is fine here - and it is exactly what the desk needs to carry on.
        return _fail(
            "DUPLICATE_EMAIL",
            f"{email} is already registered as {existing['user_id']} ({existing.get('name', '')}). "
            f"Open that record instead.",
            field="email",
            user_id=existing["user_id"],
        )

    user_id = first["user_id"]
    now = _now_iso()

    def _undo_participant() -> None:
        # Cascades to the payment row. The UserID was allocated for this
        # attempt alone, so nothing else can be hanging off it.
        try:
            db.delete("participants", f"user_id=eq.{db.enc(user_id)}")
        except Exception as cleanup:
            print(f"[spot] could not roll back participant {user_id}: {type(cleanup).__name__}: {cleanup}")

    # Created PENDING, and made APPROVED only by the LAST write, once its payment
    # row exists. A failure anywhere in between therefore leaves, at worst, a
    # pending registration the desk shows without a pass - never an approved
    # participant whose fee is recorded nowhere.
    try:
        rows = db.insert(
            "participants",
            {
                "user_id": user_id,
                "name": str(data["name"]).strip(),
                "email": email,
                "phone": phone,
                "college": str(data["college"]).strip(),
                "department": str(data["department"]).strip(),
                "year": str(data["year"]).strip(),
                "food_preference": str(data.get("food_preference", "VEG")).strip().upper(),
                "payment_status": "PENDING",
            },
        )
    except Zin26Error as e:
        if e.code == "DUPLICATE":
            return _fail("DUPLICATE_EMAIL", f"{email} was registered a moment ago. Search for it instead.",
                         field="email")
        _undo_participant()
        raise
    except Exception:
        # A timeout says nothing about whether the row landed.
        _undo_participant()
        raise Zin26Error(
            f"The database did not answer in time. Search for {email} before registering again.",
            status=503, code="DB_TIMEOUT",
        )

    participant = rows[0] if rows else {"user_id": user_id, "name": str(data["name"]).strip(), "email": email}

    admin_name = str(admin.get("name") or admin.get("username") or "admin")
    payment: Dict[str, Any] = {
        "user_id": user_id,
        "amount": ON_SPOT_FEE,
        "status": "APPROVED",
        "approved_at": now,
        "approval_note": f"{SPOT_NOTE_PREFIX} | {PAYMENT_METHODS[method]} | collected by {admin_name}"[:500],
    }
    if payee_upi:
        # Which of the two accounts took it - the admin queue's Bank column.
        payment["payee_upi"] = payee_upi
    # approved_by is a uuid column; seed-fallback admins have no uuid.
    admin_id = str(admin.get("id") or "").strip()
    if re.fullmatch(r"[0-9a-fA-F-]{36}", admin_id):
        payment["approved_by"] = admin_id

    try:
        db.insert("payments", payment)
        db.update("participants", f"user_id=eq.{db.enc(user_id)}", {"payment_status": "APPROVED"})
    except Exception:
        _undo_participant()
        raise
    participant["payment_status"] = "APPROVED"

    # Sending the pass over SMTP takes seconds. The desk page asks for it to be
    # held back (defer_email) and sends it straight after, through send_pass,
    # so the person's panel opens at once and events can be picked while the
    # email is on its way. A caller that does not ask still gets it sent here.
    defer_email = bool(data.get("defer_email"))
    email_sent = None if defer_email else _send_pass(participant)

    log_action(
        "SPOT_REGISTER", "participant", user_id,
        detail={"method": method, "amount": ON_SPOT_FEE,
                "payee": payee_upi or None, "email_sent": email_sent},
    )

    if defer_email:
        message = f"{user_id} registered."
    elif email_sent:
        message = f"{user_id} registered and the pass was emailed to {email}."
    else:
        message = (f"{user_id} registered, but the pass email could NOT be sent. Show the pass on screen "
                   f"or use Resend pass.")
    return {
        "success": True,
        "participant": _person_view(participant),
        "amount": ON_SPOT_FEE,
        "payment_method": method,
        "email_sent": email_sent,
        "message": message,
    }


def send_pass(user_id: str) -> Dict[str, Any]:
    """
    POST /api/admin/spot/participants/<user_id>/send-pass

    Emails the pass (EMAIL #2). The desk calls it right after a walk-in
    registers, and for "Resend pass email". A walk-in gets the desk wording;
    someone who registered online gets the online wording, which tells them to
    log in and pick events.
    """
    uid = _normalise_user_id(user_id)
    if not is_valid_user_id(uid):
        return _fail("INVALID_USER_ID", "That UserID does not look right - check it.")

    got = _together({
        "person": lambda: _participant(uid),
        "payment": lambda: db.select_one(
            "payments", f"select=approval_note&user_id=eq.{db.enc(uid)}&order=created_at.desc"
        ),
    })
    person = got["person"]
    if not person:
        return _fail("NOT_FOUND", f"No participant with UserID {uid}.")
    if str(person.get("payment_status") or "").upper() != "APPROVED":
        return _fail("NOT_APPROVED", "No pass is issued until the payment is approved.")

    on_spot = is_spot_note((got["payment"] or {}).get("approval_note"))
    sent = _send_pass(person, on_spot=on_spot)
    log_action("SPOT_PASS_EMAIL", "participant", uid, detail={"sent": sent, "on_spot": on_spot})
    if not sent:
        return _fail(
            "EMAIL_FAILED",
            f"The pass email to {person.get('email')} could not be sent. Show the pass on screen, "
            f"or try Resend pass email.",
        )
    return {"success": True, "sent": True, "message": f"Pass emailed to {person.get('email')}."}


# --- find ------------------------------------------------------------------------

def search(q: str, admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    GET /api/admin/spot/search?q=

    A UserID, an email, a 10-digit phone number, or part of a name.

    A desk-only login (onspot1/onspot2) gets exact lookups only - a full
    UserID, email or phone - never a partial UserID or a name, which would let
    it page through every participant's contact details.
    """
    term = (q or "").strip()
    if len(term) < 3:
        return _fail("VALIDATION_ERROR", "Type at least 3 characters: a UserID, email, phone or name.")

    fields = "select=user_id,name,email,phone,college,payment_status"
    upper = term.upper()
    digits = re.sub(r"\D", "", term)
    exact_only = str((admin or {}).get("role") or "").upper() == DESK_ROLE

    if exact_only and not (
        is_valid_user_id(upper) or "@" in term
        or (len(digits) >= 10 and not re.search(r"[A-Za-z]", term))
    ):
        return _fail("VALIDATION_ERROR", "At the desk, search by the full UserID (from the pass), "
                                         "email or 10-digit phone number.")

    if is_valid_user_id(upper):
        query = f"{fields}&user_id=eq.{db.enc(upper)}"
    elif upper.startswith("ZIN26"):
        query = f"{fields}&user_id=ilike.{db.enc('*' + upper + '*')}"
    elif "@" in term:
        query = f"{fields}&email=eq.{db.enc(term.lower())}"
    elif len(digits) >= 10 and not re.search(r"[A-Za-z]", term):
        # Stored as 10 bare digits; "+91 98765 43210" is the same number.
        query = f"{fields}&phone=eq.{db.enc(digits[-10:])}"
    else:
        query = f"{fields}&name=ilike.{db.enc('*' + term + '*')}"

    rows = db.select("participants", f"{query}&order=created_at.desc&limit=10")
    return {"success": True, "results": rows}


def person_detail(user_id: str, admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    GET /api/admin/spot/participants/<user_id>

    Everything the desk shows for one person: details, payment, live
    registrations and the event catalogue as the desk sees it (close dates
    lifted, admin closures applied).
    """
    uid = _normalise_user_id(user_id)
    if not is_valid_user_id(uid):
        return _fail("INVALID_USER_ID", "That UserID does not look right - check it.")

    # Two rounds of reads instead of six or more in a row: everything that
    # needs only the UserID first, then what depends on those answers.
    first = _together({
        "participant": lambda: _participant(uid),
        "live": lambda: db.select(
            "registrations",
            f"select=reg_id,event_code,status,team_id,source,created_at"
            f"&user_id=eq.{db.enc(uid)}&status=neq.CANCELLED",
        ),
        "events": lambda: db.select("events", f"select={EVENT_FIELDS}"),
        "payment": lambda: db.select_one(
            "payments",
            f"select=amount,status,txn_ref,approval_note,created_at&user_id=eq.{db.enc(uid)}&order=created_at.desc",
        ),
    })
    participant = first["participant"]
    if not participant:
        return _fail("NOT_FOUND", f"No participant with UserID {uid}.")
    live, events, payment = first["live"], first["events"], first["payment"]

    team_ids = sorted({r["team_id"] for r in live if r.get("team_id")})
    capped = [e for e in events if e.get("capacity") is not None]
    second_calls: Dict[str, Callable[[], Any]] = {
        f"seats:{e['code']}": (lambda e=e: _remaining_seats(e)) for e in capped
    }
    if team_ids:
        second_calls["teams"] = lambda: db.select(
            "teams",
            f"select=team_id,team_name,captain_user_id,status,topic&team_id=in.({','.join(team_ids)})",
        )
    second = _together(second_calls)

    team_rows: Dict[str, Dict[str, Any]] = {t["team_id"]: t for t in second.get("teams", [])}

    registrations = []
    for r in live:
        team = team_rows.get(r.get("team_id") or "") or {}
        event = rules.EVENTS.get(r["event_code"])
        registrations.append({
            "reg_id": r["reg_id"],
            "event_code": r["event_code"],
            "event_name": event.name if event else r["event_code"],
            "status": r["status"],
            "source": r.get("source") or "ONLINE",
            "team_id": r.get("team_id"),
            "team_name": team.get("team_name"),
            "team_status": team.get("status"),
            "is_captain": bool(team) and team.get("captain_user_id") == uid,
            "captain_user_id": team.get("captain_user_id"),
        })

    held = [r["event_code"] for r in live]
    active = {e["code"]: e.get("is_active") for e in events}
    capacity = {e["code"]: second[f"seats:{e['code']}"] for e in capped}

    catalog = rules.evaluate_catalog(
        payment_status=participant["payment_status"],
        existing=held,
        capacity_by_event=capacity,
        ignore_close_date=True,
    )
    for card in catalog:
        card["asks_topic"] = card["event_code"] in rules.TOPIC_EVENTS
        if card["state"] == "AVAILABLE" and active.get(card["event_code"]) is False:
            card.update(state="BLOCKED", reason="Closed by the organisers", rule="R12", warnings=[])

    if payment:
        payment = {**payment, "is_spot": is_spot_note(payment.get("approval_note"))}
        # A desk login sees the desk's own payment note, not a website payment's
        # bank reference or a treasurer's Bypass reason.
        if not payment["is_spot"] and str((admin or {}).get("role") or "").upper() == DESK_ROLE:
            payment.pop("txn_ref", None)
            payment.pop("approval_note", None)
    return {
        "success": True,
        "participant": _person_view(participant),
        "payment": payment,
        "registrations": registrations,
        "catalog": catalog,
        "counted_used": sum(
            1 for c in held if c in rules.EVENTS and rules.EVENTS[c].counts_toward_limit
        ),
        "counted_max": rules.DEFAULT_CONFIG["max_counted_events"],
    }


def check_member(user_id: str, event_code: str) -> Dict[str, Any]:
    """
    GET /api/admin/spot/check-member?user_id=&event=

    Behind each teammate field: who this is, and whether they can join.
    """
    event = rules.EVENTS.get(event_code or "")
    if not event:
        return _fail("UNKNOWN_EVENT", "Unknown event.")

    uid = _normalise_user_id(user_id)
    if not is_valid_user_id(uid):
        return _fail("INVALID_USER_ID", "That UserID does not look right - check it.")

    participant = _participant(uid)
    if not participant:
        return _fail("NOT_FOUND", f"No participant with UserID {uid}.")

    decision = rules.can_register(
        payment_status=participant["payment_status"],
        event_code=event.code,
        existing=regs.held_event_codes(uid),
        remaining_capacity=_remaining_seats(_event_row(event.code)),
        ignore_close_date=True,
    )

    return {
        "success": True,
        "user_id": uid,
        "name": participant.get("name"),
        "college": participant.get("college"),
        "payment_status": participant.get("payment_status"),
        "blocked_reason": None if decision.ok else decision.message,
        "blocked_rule": None if decision.ok else decision.rule,
    }


# --- seats -----------------------------------------------------------------------

def _past_online_close(event: Optional[Dict[str, Any]]) -> bool:
    """Has this event's online registration closed (zin26.events.reg_closes_at)?"""
    closes = (event or {}).get("reg_closes_at")
    if not closes:
        return False
    try:
        return _utcnow() >= dt.datetime.fromisoformat(str(closes))
    except ValueError:
        return False


def _claim_seat(user_id: str, event_code: str, team_id: Optional[str] = None) -> str:
    """
    Write one registration row with source SPOT.

    While online registration is open, the locking database function goes
    first, because it re-counts capacity under a row lock. Once the event's
    reg_closes_at has passed - 9:00 PM on 23 September, and all of the fest
    day - that function refuses every call, so the desk does not try it: it
    writes the row itself, after re-checking what the function would have:
    the event is still open on the Events page, and there is still a seat.
    Deciding by the clock rather than by how the database words its refusal
    means a reworded error can never shut the desk. A refusal reported as
    ZIN26_EVENT_UNKNOWN still falls through to the same write, as before. The
    partial unique index on live (user_id, event_code) rows still stops a
    duplicate either way.

    That capacity check is not under a lock, so the row is re-ranked after the
    insert: if two desks take the last seat at once, the later claim backs out.
    """
    event = _event_row(event_code)
    if not _past_online_close(event):
        try:
            return regs.rpc_register(user_id, event_code, team_id=team_id, status="CONFIRMED", source="SPOT")
        except Zin26Error as e:
            if e.code != "UNKNOWN_EVENT":
                raise

    name = rules.EVENTS[event_code].name if event_code in rules.EVENTS else event_code
    if not event:
        raise Zin26Error("Unknown event", status=404, code="UNKNOWN_EVENT")
    if _closed_by_admin(event):
        raise Zin26Error(f"{name} has been closed by the organisers.", status=409, code="EVENT_INACTIVE")

    # A member joining a team that already holds its seat takes no new one.
    joining_team = bool(team_id) and bool(db.select_one(
        "registrations",
        f"select=reg_id&event_code=eq.{db.enc(event_code)}&team_id=eq.{db.enc(team_id)}"
        f"&status=neq.CANCELLED",
    ))
    remaining = _remaining_seats(event)
    if remaining is not None and remaining <= 0 and not joining_team:
        raise Zin26Error(f"{name} is full.", status=409, code="EVENT_FULL")

    row: Dict[str, Any] = {
        "user_id": user_id,
        "event_code": event_code,
        "status": "CONFIRMED",
        "source": "SPOT",
    }
    if team_id:
        row["team_id"] = team_id

    try:
        rows = db.insert("registrations", row)
    except Zin26Error as e:
        if e.code == "DUPLICATE":
            raise Zin26Error("Already registered", status=409, code="ALREADY_REGISTERED")
        raise
    reg_id = rows[0].get("reg_id", "") if rows else ""

    if remaining is not None and not joining_team and reg_id != "" and not _within_capacity(event, reg_id, team_id):
        db.delete("registrations", f"reg_id=eq.{db.enc(reg_id)}")
        raise Zin26Error(f"{name} is full.", status=409, code="EVENT_FULL")
    return str(reg_id)


def register_event(user_id: str, event_code: str, confirm_warnings: bool = False) -> Dict[str, Any]:
    """POST /api/admin/spot/events/register - an individual event."""
    uid = _normalise_user_id(user_id)
    if not is_valid_user_id(uid):
        return _fail("INVALID_USER_ID", "That UserID does not look right - check it.")

    participant = _participant(uid)
    if not participant:
        return _fail("NOT_FOUND", f"No participant with UserID {uid}.")

    event = rules.EVENTS.get(event_code or "")
    if not event:
        return _fail("UNKNOWN_EVENT", "Unknown event.")

    if event.min_team > 1:
        size = str(event.min_team) if event.min_team == event.max_team else f"{event.min_team}-{event.max_team}"
        return _fail("TEAM_EVENT", f"{event.name} needs a team of {size}. Use Form team.")

    row = _event_row(event.code)
    if _closed_by_admin(row):
        return _fail("EVENT_INACTIVE", f"{event.name} has been closed by the organisers.")

    decision = rules.can_register(
        payment_status=participant["payment_status"],
        event_code=event.code,
        existing=regs.held_event_codes(uid),
        remaining_capacity=_remaining_seats(row),
        ignore_close_date=True,
    )
    if not decision.ok:
        return _decision_error(decision)

    if decision.warnings and not confirm_warnings:
        return _fail(
            "CONFIRMATION_REQUIRED",
            decision.warnings[0].message,
            warnings=[w.message for w in decision.warnings],
        )

    reg_id = _claim_seat(uid, event.code)
    log_action("SPOT_EVENT_REGISTER", "participant", uid, detail={"event": event.code, "reg_id": reg_id})

    return {
        "success": True,
        "reg_id": reg_id,
        "event_code": event.code,
        "message": f"{participant.get('name') or uid} is registered for {event.name}.",
    }


def create_team(
    event_code: str,
    team_name: str,
    member_user_ids: List[str],
    topic: str = "",
    confirm_warnings: bool = False,
) -> Dict[str, Any]:
    """
    POST /api/admin/spot/teams

    member_user_ids[0] is the captain. The team is CONFIRMED on creation and
    every member's row is written CONFIRMED - nobody has an invitation to
    accept, because everybody is at the desk.
    """
    event = rules.EVENTS.get(event_code or "")
    if not event:
        return _fail("UNKNOWN_EVENT", "Unknown event.")
    if event.max_team <= 1:
        return _fail("NOT_A_TEAM_EVENT", f"{event.name} is an individual event.")

    team_name = (team_name or "").strip()
    if not team_name:
        return _fail("VALIDATION_ERROR", "Give the team a name.", field="team_name")

    topic = (topic or "").strip() if event.code in rules.TOPIC_EVENTS else ""
    if event.code in rules.TOPIC_EVENTS:
        if not topic:
            return _fail("VALIDATION_ERROR", "Enter the topic the team will present.", field="topic")
        if len(topic) > rules.TOPIC_MAX_LEN:
            return _fail("VALIDATION_ERROR", f"Keep the topic under {rules.TOPIC_MAX_LEN} characters.",
                         field="topic")

    ids: List[str] = []
    for raw in member_user_ids or []:
        uid = _normalise_user_id(raw)
        if not uid or uid in ids:
            continue
        if not is_valid_user_id(uid):
            return _fail("INVALID_USER_ID", f"{uid} does not look like a UserID - check it.", user_id=uid)
        ids.append(uid)

    if not ids:
        return _fail("VALIDATION_ERROR", "Add the team members' UserIDs.")

    row = _event_row(event.code)
    if _closed_by_admin(row):
        return _fail("EVENT_INACTIVE", f"{event.name} has been closed by the organisers.")

    people = teams._load_participants(ids)
    missing = [uid for uid in ids if uid not in people]
    if missing:
        return _fail("NOT_FOUND", f"No participant with UserID {missing[0]}.", user_id=missing[0])

    decision = rules.can_register_team(
        event_code=event.code,
        members=[
            {
                "user_id": uid,
                "payment_status": people[uid]["payment_status"],
                "existing": regs.held_event_codes(uid),
            }
            for uid in ids
        ],
        remaining_capacity=_remaining_seats(row),
        ignore_close_date=True,
    )
    if not decision.ok:
        return _decision_error(decision)

    if decision.warnings and not confirm_warnings:
        return _fail(
            "CONFIRMATION_REQUIRED",
            decision.warnings[0].message,
            warnings=[w.message for w in decision.warnings],
        )

    captain = ids[0]
    team_rows = teams._insert_team(event.code, team_name, captain, topic, status="CONFIRMED")
    if not team_rows:
        raise Zin26Error("team insert returned nothing")
    team_id = team_rows[0]["team_id"]

    now = _now_iso()
    try:
        db.insert(
            "team_members",
            [
                {
                    "team_id": team_id,
                    "user_id": uid,
                    "role": "CAPTAIN" if uid == captain else "MEMBER",
                    "accept_status": "ACCEPTED",
                    "responded_at": now,
                }
                for uid in ids
            ],
        )
        for uid in ids:
            _claim_seat(uid, event.code, team_id=team_id)
    except Exception:
        # A half-built team holds seats nobody can release, so it goes.
        teams._hard_delete_team(team_id)
        raise

    log_action("SPOT_TEAM_CREATE", "team", team_id, detail={"event": event.code, "members": ids})

    view = teams._team_view(team_id)
    return {
        "success": True,
        "team": view,
        "message": f"Team {team_name} is registered for {event.name} ({len(ids)} members).",
    }


def cancel_event(user_id: str, event_code: str, admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    POST /api/admin/spot/events/cancel

    The desk's undo. For a team registration it must be the captain's record,
    and it cancels the whole team, exactly as the website does.
    """
    uid = _normalise_user_id(user_id)
    if not is_valid_user_id(uid):
        return _fail("INVALID_USER_ID", "That UserID does not look right - check it.")

    event = rules.EVENTS.get(event_code or "")
    if not event:
        return _fail("UNKNOWN_EVENT", "Unknown event.")

    reg = db.select_one(
        "registrations",
        f"select=reg_id,team_id,source&user_id=eq.{db.enc(uid)}&event_code=eq.{db.enc(event.code)}"
        f"&status=neq.CANCELLED",
    )
    if not reg:
        return _fail("NOT_REGISTERED", f"{uid} is not registered for {event.name}.")
    # A desk login undoes desk work only; an online registration is the
    # treasurer's to remove.
    if str((admin or {}).get("role") or "").upper() == DESK_ROLE and (reg.get("source") or "ONLINE") != "SPOT":
        return _fail("NOT_DESK_REGISTRATION",
                     f"{event.name} was registered online. Ask the treasurer to remove it.")

    affected = [uid]
    if reg.get("team_id"):
        team = db.select_one("teams", f"select=captain_user_id&team_id=eq.{db.enc(reg['team_id'])}")
        if team and team.get("captain_user_id") != uid:
            return _fail(
                "NOT_CAPTAIN",
                f"Only the captain can cancel this team. Open {team['captain_user_id']} to cancel it.",
                captain_user_id=team["captain_user_id"],
            )
        members = db.select("team_members", f"select=user_id&team_id=eq.{db.enc(reg['team_id'])}")
        affected = [m["user_id"] for m in members] or [uid]

    # Every member loses the row, so every member's R7 is checked - not just
    # the captain's. A member who already declined holds no row and is skipped.
    for member in affected:
        held = regs.held_event_codes(member)
        if event.code not in held:
            continue
        decision = rules.can_cancel(event_code=event.code, existing=held, ignore_close_date=True)
        if not decision.ok:
            message = decision.message if member == uid else f"{member}: {decision.message}"
            return _fail(decision.code, message, rule=decision.rule, user_id=member)

    moved = regs.rpc_cancel(uid, event.code, event.name)
    log_action(
        "SPOT_EVENT_CANCEL", "participant", uid,
        detail={
            "event": event.code,
            "team_id": reg.get("team_id"),
            "source": reg.get("source") or "ONLINE",
            "members": affected,
            "rows": moved,
        },
    )

    return {
        "success": True,
        "cancelled": moved,
        "message": (
            f"{event.name} team cancelled for every member."
            if reg.get("team_id") else
            f"{event.name} removed for {uid}."
        ),
    }
