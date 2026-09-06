"""
Zinnia 2026 — participant registration lifecycle, derived from existing data.

The participant-facing registration code (user_id, "ZIN26-0142") is the LOGIN
CREDENTIAL. Since login by email address was removed it is the only identifier
a participant can present, so it is released as soon as the email address is
VERIFIED and is emailed to them with their registration confirmation. Holding
it back to treasurer approval, as it once was, would lock every unconfirmed
participant out of the dashboard they are meant to be using.

Before the address is proven there is nowhere safe to send it, so the flow is
keyed by an INTERNAL identifier instead: the participant row's master_qr_token
UUID, exposed to the browser as `registration_id`. It is random, unique and
already on the row, so it costs no schema change and cannot be guessed into a
neighbour's registration the way a sequential code could.

STATE MODEL — no new column. zin26.participants has payment_status
(PENDING/APPROVED/REJECTED), zin26.payments has txn_ref/status, and a consumed
row in login_otps is proof the email was verified. The lifecycle is derived:

    DETAILS_SUBMITTED        row exists, email not yet verified
    OTP_VERIFIED             email verified, no payment submitted yet
    PAYMENT_RECEIVED         UTR + screenshot submitted, awaiting the treasurer
    PAYMENT_FAILED           treasurer rejected it (resubmit from the same form)
    REGISTRATION_CONFIRMED   treasurer approved — code and QR are released

Deriving instead of storing means the state can never disagree with the facts
it is computed from, and there is nothing extra to keep in sync on every write.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from services import zin26_db as db

DETAILS_SUBMITTED = "DETAILS_SUBMITTED"
OTP_VERIFIED = "OTP_VERIFIED"
PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
PAYMENT_FAILED = "PAYMENT_FAILED"
REGISTRATION_CONFIRMED = "REGISTRATION_CONFIRMED"

# Every column the flow ever needs, so callers do one select and pass the row on.
PARTICIPANT_FIELDS = (
    "user_id,name,email,phone,college,department,year,food_preference,"
    "payment_status,master_qr_token,created_at"
)

PAYMENT_FIELDS = "id,user_id,amount,txn_ref,status,reject_reason,screenshot_url,approved_at,created_at"


# --- lookups -----------------------------------------------------------------

def resolve_participant(
    *,
    registration_id: str = "",
    user_id: str = "",
    email: str = "",
) -> Optional[Dict[str, Any]]:
    """Find the participant by whichever identifier the caller has."""
    registration_id = (registration_id or "").strip()
    user_id = (user_id or "").strip().upper()
    email = (email or "").strip().lower()

    if registration_id:
        return db.select_one("participants", f"select={PARTICIPANT_FIELDS}&master_qr_token=eq.{registration_id}")
    if user_id:
        return db.select_one("participants", f"select={PARTICIPANT_FIELDS}&user_id=eq.{user_id}")
    if email:
        return db.select_one("participants", f"select={PARTICIPANT_FIELDS}&email=eq.{db.enc(email)}")
    return None


def email_is_verified(user_id: str) -> bool:
    """True once the participant has consumed at least one emailed code."""
    user_id = (user_id or "").strip().upper()
    if not user_id:
        return False
    row = db.select_one(
        "login_otps",
        f"select=id&user_id=eq.{user_id}&consumed_at=not.is.null&limit=1",
    )
    return row is not None


def latest_payment(user_id: str) -> Optional[Dict[str, Any]]:
    return db.select_one(
        "payments",
        f"select={PAYMENT_FIELDS}&user_id=eq.{user_id}&order=created_at.desc",
    )


# --- derivation --------------------------------------------------------------

def derive_status(
    participant: Dict[str, Any],
    payment: Optional[Dict[str, Any]],
    verified: bool,
) -> str:
    ps = (participant.get("payment_status") or "PENDING").upper()
    if ps == "APPROVED":
        return REGISTRATION_CONFIRMED
    if ps == "REJECTED":
        return PAYMENT_FAILED
    if payment and payment.get("txn_ref"):
        return PAYMENT_RECEIVED
    if verified:
        return OTP_VERIFIED
    return DETAILS_SUBMITTED


def public_view(
    participant: Dict[str, Any],
    payment: Optional[Dict[str, Any]] = None,
    verified: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    What the browser is allowed to know about a registration.

    `user_id` is present once the email address has been VERIFIED, because it is
    the participant's only login credential and they cannot reach their
    dashboard without it. Before that the key is there but null, so the
    frontend can branch on it without ever having seen the value.

    What treasurer approval still gates is the pass, not the credential: the
    master QR and the `whatsapp_url` below.
    """
    if verified is None:
        verified = email_is_verified(participant["user_id"])
    if payment is None:
        payment = latest_payment(participant["user_id"])

    status = derive_status(participant, payment, verified)
    confirmed = status == REGISTRATION_CONFIRMED
    # A verified address means the UserID has somewhere safe to go, and the
    # participant needs it to log in at all. See the module docstring.
    credential_released = bool(verified)

    view: Dict[str, Any] = {
        "registration_id": participant.get("master_qr_token"),
        "name": participant.get("name"),
        "email": participant.get("email"),
        "email_verified": bool(verified),
        "payment_submitted": bool(payment and payment.get("txn_ref")),
        "payment_verified": confirmed,
        "registration_status": status,
        "user_id": participant.get("user_id") if credential_released else None,
    }

    if confirmed:
        # The WhatsApp link is part of the confirmation, not the sign-up.
        from services.email_service import PARTICIPANTS_WHATSAPP_GROUP_URL

        view["whatsapp_url"] = PARTICIPANTS_WHATSAPP_GROUP_URL

    return view


def payment_view(payment: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """The payment record without internal ids."""
    if not payment:
        return None
    return {
        "txn_ref": payment.get("txn_ref"),
        "amount": payment.get("amount"),
        "status": payment.get("status"),
        "reject_reason": payment.get("reject_reason"),
        "screenshot_url": payment.get("screenshot_url"),
        "submitted_at": payment.get("created_at"),
    }
