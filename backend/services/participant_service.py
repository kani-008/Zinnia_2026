"""
Zinnia 2026 — Phase 3: participant registration + payment (doc §4.1).

Stage 1 of the flow: personal details -> payment submission -> UserID issued
IMMEDIATELY, without waiting for the treasurer. Verification is a separate
async queue (D1). Issuing the UserID up front is what makes team formation
work in Phase 5 — teammates are identified by UserID, so a team would
otherwise be stuck behind its slowest member's verification.

Flat Rs. 250 per PARTICIPANT (D6), never multiplied by team size.
One master QR per participant (§4.5), issued here and reused by every event
desk on the day.
"""

import os
import datetime as dt
import re
from typing import Any, Dict, Optional

from services import zin26_db as db
from services.zin26_db import Zin26Error

REGISTRATION_FEE = int(os.getenv("REGISTRATION_FEE_PER_HEAD", "250"))

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")
PHONE_RE = re.compile(r"^[0-9]{10}$")

USER_ID_PREFIX = "ZIN26"

# A property of the person, not of any one registration — the food desk reads it.
FOOD_PREFERENCES = ("VEG", "NON_VEG")


# --- UserID ----------------------------------------------------------------

def _check_digit(digits: str) -> int:
    """
    Luhn check digit over the sequence portion.

    Catches the single-digit and adjacent-transposition typos people make when
    reading a UserID off an email and typing it into the add-teammate field in
    Phase 5, which is the only place these get hand-entered.
    """
    total = 0
    for i, ch in enumerate(reversed(digits)):
        n = int(ch)
        if i % 2 == 0:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return (10 - total % 10) % 10


def build_user_id(serial: int) -> str:
    """
    ZIN26-XXXX: a zero-padded sequence plus one trailing check digit.

    Serial 14 -> "ZIN26-0142" (014 + check digit 2), matching the doc's
    examples. Past serial 999 the code grows to five digits rather than
    wrapping or colliding — the doc's fixed XXXX shape assumes fewer than
    1000 participants, and silently breaking at 1000 would be worse than
    getting one character longer.
    """
    body = str(serial).zfill(3)
    return f"{USER_ID_PREFIX}-{body}{_check_digit(body)}"


def is_valid_user_id(user_id: str) -> bool:
    if not user_id:
        return False
    m = re.fullmatch(rf"{USER_ID_PREFIX}-(\d{{3,}})(\d)", user_id.strip().upper())
    if not m:
        return False
    body, check = m.group(1), int(m.group(2))
    return _check_digit(body) == check


def _next_user_id() -> str:
    """
    Allocate the next UserID from the zin26.participant_serial sequence.

    Uses the DB sequence rather than count()+1 so two simultaneous
    registrations cannot be handed the same code.
    """
    import requests

    r = requests.post(
        f"{db.SUPABASE_URL}/rest/v1/rpc/next_participant_serial",
        headers=db.write_headers(prefer="return=representation"),
        json={},
        timeout=db.TIMEOUT,
    )
    if r.status_code not in (200, 201):
        raise Zin26Error(
            f"could not allocate a UserID - is migration 008 applied? HTTP "
            f"{r.status_code} {r.text[:200]}"
        )
    serial = r.json()
    if isinstance(serial, list):
        serial = serial[0] if serial else None
    if isinstance(serial, dict):
        serial = next(iter(serial.values()), None)
    if serial is None:
        raise Zin26Error("sequence returned no value")
    return build_user_id(int(serial))


# --- registration ----------------------------------------------------------

def _validate_details(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    required = {
        "name": "Name is required.",
        "college": "College is required.",
        "department": "Department is required.",
        "year": "Year of study is required.",
        "email": "Email is required.",
        "phone": "Phone number is required.",
    }
    for field, msg in required.items():
        if not str(data.get(field, "")).strip():
            return {"success": False, "error_code": "VALIDATION_ERROR", "field": field, "message": msg}

    email = str(data["email"]).strip().lower()
    if not EMAIL_RE.match(email):
        return {
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "field": "email",
            "message": "Enter a valid email address.",
        }

    phone = re.sub(r"\D", "", str(data["phone"]))
    if not PHONE_RE.match(phone):
        return {
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "field": "phone",
            "message": "Enter a valid 10-digit phone number.",
        }

    food = str(data.get("food_preference", "VEG")).strip().upper()
    if food not in FOOD_PREFERENCES:
        return {
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "field": "food_preference",
            "message": "Choose Veg or Non-Veg.",
        }
    return None


# --- endpoints -------------------------------------------------------------

def register_participant(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    POST /api/participant/register

    Creates the zin26.participants row and its AWAITING_PAYMENT payment row.
    The UserID is issued here; the participant does not wait for a treasurer.
    """
    invalid = _validate_details(data)
    if invalid:
        return invalid

    email = str(data["email"]).strip().lower()
    phone = re.sub(r"\D", "", str(data["phone"]))

    existing = db.select_one("participants", f"select=user_id,email&email=eq.{db.enc(email)}")
    if existing:
        return {
            "success": False,
            "error_code": "DUPLICATE_EMAIL",
            "field": "email",
            # Never echo the UserID here: it is the login credential, and this
            # branch is reachable by anyone who knows the email address.
            "message": (
                "This email is already registered. Log in with the UserID from your "
                "registration email to see your status."
            ),
        }

    user_id = _next_user_id()

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
            return {
                "success": False,
                "error_code": "DUPLICATE_EMAIL",
                "field": "email",
                "message": "This email is already registered.",
            }
        raise

    participant = rows[0] if rows else {}

    # Flat Rs. 250 per participant (D6) — never multiplied by team size.
    db.insert(
        "payments",
        {
            "user_id": user_id,
            "amount": REGISTRATION_FEE,
            "status": "PENDING",
        },
    )

    # The participant-facing code (user_id) exists now, but it is a
    # confirmation credential and is not released until the treasurer verifies
    # the payment. The browser gets the internal registration_id instead.
    from services.registration_state import public_view

    return {
        "success": True,
        **public_view(participant, payment=None, verified=False),
        "expected_amount": REGISTRATION_FEE,
        "message": "Details saved. We have sent a 6-digit code to your email to verify the address.",
    }


def submit_payment(data: Dict[str, Any], screenshot: Any = None) -> Dict[str, Any]:
    """
    POST /api/participant/payment/submit

    Records the UTR + amount and flips the payment to PENDING_VERIFICATION.
    This is the END of registration: the account is live, the dashboard is
    open and all nine events are selectable from here on. Sends EMAIL #1, the
    "you're registered" confirmation.

    The treasurer's later approval is NOT a gate on any of that. It releases
    exactly two things — the master QR entry pass and the WhatsApp group link
    — via EMAIL #2 (send_master_qr_email) and the dashboard pass panel.
    """
    user_id = str(data.get("user_id", "")).strip().upper()
    registration_id = str(data.get("registration_id", "")).strip()
    utr = str(data.get("utr_number", "")).strip()
    submitted_amount = data.get("submitted_amount", REGISTRATION_FEE)

    # Pre-confirmation clients only hold the internal registration_id.
    if registration_id and not user_id:
        from services.registration_state import resolve_participant

        resolved = resolve_participant(registration_id=registration_id)
        if not resolved:
            return {"success": False, "error_code": "NOT_FOUND", "message": "Registration not found."}
        user_id = resolved["user_id"]

    if not user_id:
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "Registration reference is required."}
    if not is_valid_user_id(user_id):
        return {
            "success": False,
            "error_code": "INVALID_USER_ID",
            "message": "That UserID does not look right - check it against your registration email.",
        }
    if not utr or len(utr) < 6:
        return {
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "field": "utr_number",
            "message": "Enter the UTR / transaction reference from your payment app.",
        }

    # Proof screenshot (§4.1 "participant uploads screenshot + enters transaction
    # reference"). Required on a first submission; on a resubmission the earlier
    # proof stands unless a new one is sent. Validated before any DB read.
    proof_bytes: Optional[bytes] = None
    proof_mime: Optional[str] = None
    if screenshot is not None and getattr(screenshot, "filename", ""):
        proof_mime = (screenshot.mimetype or "").lower()
        if proof_mime not in db.PROOF_MIME_EXT:
            return {
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "field": "screenshot",
                "message": "Upload the payment screenshot as a JPG, PNG or WEBP image.",
            }
        proof_bytes = screenshot.read()
        if len(proof_bytes) > db.PROOF_MAX_BYTES:
            return {
                "success": False,
                "error_code": "VALIDATION_ERROR",
                "field": "screenshot",
                "message": "The screenshot is larger than 5 MB - crop it or export it smaller.",
            }
        if not proof_bytes:
            proof_bytes = None

    participant = db.select_one("participants", f"select=*&user_id=eq.{user_id}")
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "No participant with that UserID."}

    # A payment against an unverified address attaches Rs. 250 to a possible
    # typo. The email step comes before this screen; refuse if it was skipped.
    from services.participant_auth_service import email_is_verified  # lazy: auth imports this module

    if not email_is_verified(user_id):
        return {
            "success": False,
            "error_code": "EMAIL_NOT_VERIFIED",
            "message": "Verify your email first - we sent a code to the address you registered with.",
        }

    payment = db.select_one("payments", f"select=*&user_id=eq.{user_id}&order=created_at.desc")
    if not payment:
        payment = (
            db.insert(
                "payments",
                {"user_id": user_id, "amount": REGISTRATION_FEE, "status": "PENDING"},
            )
            or [{}]
        )[0]

    if proof_bytes is None and not payment.get("screenshot_url"):
        return {
            "success": False,
            "error_code": "SCREENSHOT_REQUIRED",
            "field": "screenshot",
            "message": "Attach a screenshot of the payment - the treasurer verifies against it.",
        }

    # A resubmission supersedes any earlier rejection: the reason goes, and the
    # participant row is mirrored back to PENDING below so the derived state
    # reads PAYMENT_RECEIVED again.
    update: Dict[str, Any] = {"txn_ref": utr, "amount": submitted_amount, "status": "PENDING", "reject_reason": None}
    if proof_bytes is not None and proof_mime:
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S")
        object_path = f"{user_id}/{stamp}.{db.PROOF_MIME_EXT[proof_mime]}"
        update["screenshot_url"] = db.upload_file(object_path, proof_bytes, proof_mime)

    db.update("payments", f"id=eq.{payment['id']}", update)

    # Mirrored onto the participant row so the gate scan and every teammate
    # lookup can read payment state without a second query.
    db.update("participants", f"user_id=eq.{user_id}", {"payment_status": "PENDING"})

    email_sent = _send_registration_complete(participant)

    from services.registration_state import latest_payment, payment_view, public_view, resolve_participant

    # Re-read: the in-memory `participant` predates the writes above.
    fresh = latest_payment(user_id)
    participant = resolve_participant(user_id=user_id) or participant
    return {
        "success": True,
        **public_view(participant, payment=fresh, verified=True),
        "payment": payment_view(fresh),
        "email_sent": email_sent,
        "message": (
            "You're registered! All events are open — pick yours from the dashboard now. "
            "Your master QR and the WhatsApp group link arrive once the treasurer "
            "confirms the payment."
        ),
    }


def payment_status(user_id: str = "", registration_id: str = "") -> Dict[str, Any]:
    """
    GET /api/participant/payment/status?registration_id=... (or ?user_id=...)

    Drives every screen after the details form. Returns the derived lifecycle
    state and the payment record; the participant code is included only once
    the registration is confirmed.
    """
    from services.registration_state import (
        email_is_verified,
        latest_payment,
        payment_view,
        public_view,
        resolve_participant,
    )

    if not (user_id or registration_id):
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "Registration reference is required."}

    participant = resolve_participant(registration_id=registration_id, user_id=user_id)
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Registration not found."}

    payment = latest_payment(participant["user_id"])
    verified = email_is_verified(participant["user_id"])

    return {
        "success": True,
        **public_view(participant, payment=payment, verified=verified),
        "payment": payment_view(payment),
        "expected_amount": REGISTRATION_FEE,
    }


def _send_registration_complete(participant: Dict[str, Any]) -> bool:
    """
    EMAIL #1 at payment-submission time: "you're registered, pick your events".
    Carries no code and no QR - both belong to EMAIL #2, which the treasurer's
    approval triggers. Never fatal: a failed send must not lose a payment
    submission, and the participant can already use the dashboard regardless.
    """
    try:
        from services.email_service import send_registration_complete_email

        return bool(send_registration_complete_email(participant))
    except Exception as e:
        print(
            f"[participant_service] registration-complete email failed for "
            f"{participant.get('user_id')}: {type(e).__name__}: {e}"
        )
        return False


# --- treasurer review (the only path to REGISTRATION_CONFIRMED) -----------------

def treasurer_review_payment(
    *,
    user_id: str = "",
    registration_id: str = "",
    payment_id: str = "",
    action: str = "APPROVE",
    reason: str = "",
    admin_name: str = "Treasurer",
    admin_id: str = "",
) -> Dict[str, Any]:
    """
    POST /api/admin/payments/verify | /reject  (participant model)

    APPROVE flips payments.status and participants.payment_status to APPROVED
    and releases the pass: EMAIL #2 (UserID + master QR + WhatsApp) is sent
    here and nowhere earlier. It does NOT unlock event registration — that has
    been open since the payment was submitted. Idempotent — approving an already
    approved registration succeeds without re-sending anything, so a repeated
    click or a retried request cannot produce a second email or a second code.
    REJECT records the reason and tells the participant to resubmit; their row,
    code and any event registrations are HELD, not deleted (spec §4.1).
    """
    from services.registration_state import (
        email_is_verified,
        latest_payment,
        public_view,
        resolve_participant,
    )

    action = (action or "").strip().upper()
    if action not in ("APPROVE", "VERIFY", "REJECT"):
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "action must be APPROVE or REJECT."}
    approve = action in ("APPROVE", "VERIFY")

    payment = None
    if payment_id:
        payment = db.select_one("payments", f"select=*&id=eq.{payment_id}")
        if not payment:
            return {"success": False, "error_code": "NOT_FOUND", "message": "Payment not found."}
        user_id = payment["user_id"]

    participant = resolve_participant(registration_id=registration_id, user_id=user_id)
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "Registration not found."}
    user_id = participant["user_id"]
    payment = payment or latest_payment(user_id)
    if not payment or not payment.get("txn_ref"):
        return {
            "success": False,
            "error_code": "NO_PAYMENT",
            "message": "This participant has not submitted a payment reference yet.",
        }

    already = (participant.get("payment_status") or "").upper()
    now_iso = dt.datetime.now(dt.timezone.utc).isoformat()

    if approve:
        if already == "APPROVED":
            return {
                "success": True,
                "already_approved": True,
                **public_view(participant, payment=payment, verified=True),
                "message": "Already approved - nothing changed.",
            }
        # approved_by is a uuid FK to the admin table; a display name would be
        # rejected by Postgres (22P02). Only write it when the caller has one.
        approval: Dict[str, Any] = {"status": "APPROVED", "approved_at": now_iso, "reject_reason": None}
        if re.fullmatch(r"[0-9a-fA-F-]{36}", (admin_id or "").strip()):
            approval["approved_by"] = admin_id.strip()
        db.update("payments", f"id=eq.{payment['id']}", approval)
        db.update("participants", f"user_id=eq.{user_id}", {"payment_status": "APPROVED"})
        participant["payment_status"] = "APPROVED"

        # Release the pass: registration code, master QR and WhatsApp group link.
        # This is the first time any of the three leaves the server.
        email_sent = False
        try:
            from services.email_service import send_master_qr_email

            email_sent = bool(send_master_qr_email(participant).get("success"))
        except Exception as e:  # never fatal - the code is visible on the dashboard regardless
            print(f"[participant_service] confirmation email failed for {user_id}: {type(e).__name__}: {e}")

        return {
            "success": True,
            **public_view(participant, payment={**payment, "status": "APPROVED"}, verified=email_is_verified(user_id)),
            "email_sent": email_sent,
            "message": f"Payment approved. Registration {user_id} confirmed and the participant has been emailed.",
        }

    # REJECT
    reason = (reason or "").strip() or "The transaction reference could not be matched to a received payment."
    db.update(
        "payments",
        f"id=eq.{payment['id']}",
        {"status": "REJECTED", "reject_reason": reason, "approved_at": None, "approved_by": None},
    )
    db.update("participants", f"user_id=eq.{user_id}", {"payment_status": "REJECTED"})
    participant["payment_status"] = "REJECTED"

    email_sent = False
    try:
        from services.email_service import APP_BASE_URL, send_simple_email

        resubmit = f"{APP_BASE_URL}/participant/payment?rid={participant.get('master_qr_token')}"
        email_sent = send_simple_email(
            to=participant["email"],
            subject="Zinnia 2026 - your payment could not be verified",
            html=(
                f"<p>Hi {participant.get('name', '')},</p>"
                f"<p>The treasurer could not verify the payment reference you submitted.</p>"
                f"<p><strong>Reason:</strong> {reason}</p>"
                f"<p>Your registration is held, not cancelled. Please resubmit the correct "
                f"transaction reference and screenshot here: <a href=\"{resubmit}\">{resubmit}</a></p>"
            ),
        )
    except Exception as e:
        print(f"[participant_service] rejection email failed for {user_id}: {type(e).__name__}: {e}")

    return {
        "success": True,
        **public_view(participant, payment={**payment, "status": "REJECTED", "reject_reason": reason}, verified=email_is_verified(user_id)),
        "email_sent": email_sent,
        "message": "Payment rejected and the participant has been asked to resubmit.",
    }
