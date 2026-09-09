"""
Zinnia 2026 — Phase 4: participant login (doc §4.2).

UserID + emailed OTP, 30-day session. The UserID is the ONLY identifier that
may be presented at login; logging in with the registered email address has
been removed. `registration_id` is still accepted because the registration
flow verifies the address through these same functions before the participant
has been given a UserID — that is the sign-up path, not a login path. Reuses the HMAC token scheme already in
middleware/auth_middleware.py rather than introducing a second one — same
AUTH_SECRET_KEY, different audience claim so a participant token can never be
replayed against an admin endpoint.
"""

from __future__ import annotations

import base64
import datetime as dt
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional

from services import zin26_db as db
from services.email_service import RecipientRefused
from services.participant_service import is_valid_user_id

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not AUTH_SECRET_KEY:
    raise RuntimeError("CRITICAL SECURITY ERROR: AUTH_SECRET_KEY environment variable is missing!")

# A 30-day session (§4.2) against a 10-minute code: the code is a one-off proof
# of inbox access, the session is what the participant actually lives in.
SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
OTP_TTL_SECONDS = 600
OTP_MAX_ATTEMPTS = 5

AUDIENCE = "participant"


# --- session tokens --------------------------------------------------------

def generate_participant_token(user_id: str, expires_in: int = SESSION_TTL_SECONDS) -> tuple:
    """Returns (token, expires_at_epoch_ms)."""
    exp = int(time.time()) + expires_in
    payload = {"sub": user_id, "aud": AUDIENCE, "exp": exp}
    payload_json = json.dumps(payload, separators=(",", ":"))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip("=")
    signature = hmac.new(
        AUTH_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
    ).hexdigest()
    return f"{payload_b64}.{signature}", exp * 1000


def decode_participant_token(token: str) -> tuple:
    if not token or token.count(".") != 1:
        return False, {}, "Malformed token."

    payload_b64, signature = token.split(".")
    expected = hmac.new(
        AUTH_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return False, {}, "Invalid token signature."

    try:
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode())
    except Exception:
        return False, {}, "Unreadable token payload."

    # Audience and expiry are read only after the signature checks out — there is
    # no point trusting claims out of a payload anybody could have written.
    if payload.get("aud") != AUDIENCE:
        return False, {}, "Token is not a participant session."
    if int(payload.get("exp", 0)) < int(time.time()):
        return False, {}, "Session expired. Please log in again."

    return True, payload, ""


# --- OTP -------------------------------------------------------------------

def _hash_otp(user_id: str, otp: str) -> str:
    """Salted with the UserID so a rainbow table over 10^6 codes is useless."""
    return hashlib.sha256(f"{user_id}:{otp}:{AUTH_SECRET_KEY}".encode()).hexdigest()


def request_otp(user_id: str = "", *, registration_id: str = "") -> Dict[str, Any]:
    """
    POST /api/participant/auth/request-otp

    Two identifiers, and only two: the UserID, which is the sole login
    credential, or the internal registration_id the sign-up flow uses before a
    UserID has been handed over. Login by email address is gone, and the
    parameter with it, so no caller can reach that path. Never reveals whether
    an identifier exists beyond a generic not-found.

    A third shape reaches this now: a pending token, from someone who has filled
    the details form but has no row yet. There is nothing to look up for them —
    the details are inside the token — so that case is answered with a freshly
    minted token carrying a new code, and the browser swaps the one it holds.
    """
    from services import pending_registration as pending
    from services.registration_state import resolve_participant

    if pending.is_pending_token(registration_id):
        # Grace here, none on verify: the whole point of pressing resend is that
        # the last code is no longer good, so refusing a lapsed token and
        # demanding the form again is the opposite of what was asked for.
        payload, reason = pending.open_token(
            registration_id, grace=pending.RESEND_GRACE_SECONDS
        )
        if not payload:
            return {
                "success": False,
                "error_code": "PENDING_EXPIRED" if reason == "EXPIRED" else "NOT_FOUND",
                "message": (
                    "This registration attempt is too old to resume. Fill the form again."
                    if reason == "EXPIRED"
                    else "No registration found for that."
                ),
            }

        details = pending.details_of(payload)
        otp = f"{secrets.randbelow(1000000):06d}"
        print(f"\n[OTP] ========================================")
        print(f"[OTP] Pending Registration OTP for {details.get('email')}: {otp}")
        print(f"[OTP] ========================================\n")
        try:
            sent = send_pending_otp_email(details, otp)
        except RecipientRefused:
            return {
                "success": False,
                "error_code": "EMAIL_UNDELIVERABLE",
                "field": "email",
                "message": (
                    "That email address does not exist. Use the link below to correct it."
                ),
            }

        return {
            "success": True,
            # A new code means a new hash, so the old token is now stale. The
            # browser must carry this one forward or the resent code will not
            # verify against what it still holds.
            "registration_id": pending.mint(details, otp),
            # Full address, not masked - same reason as the register path: this
            # is the participant's own input and a typo has to be visible.
            "email_hint": str(details.get("email", "")).strip(),
            "expires_in": pending.PENDING_TTL_SECONDS,
            "email_sent": sent,
            "message": "We emailed you a 6-digit code.",
        }

    user_id = (user_id or "").strip().upper()
    if user_id and not is_valid_user_id(user_id):
        return {
            "success": False,
            "error_code": "INVALID_USER_ID",
            "message": "That UserID does not look right - check it against your registration email.",
        }
    if not (user_id or registration_id):
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "Enter your UserID."}

    participant = resolve_participant(registration_id=registration_id, user_id=user_id)
    if not participant:
        return {"success": False, "error_code": "NOT_FOUND", "message": "No registration found for that."}
    user_id = participant["user_id"]

    otp = f"{secrets.randbelow(1000000):06d}"
    print(f"\n[OTP] ========================================")
    print(f"[OTP] Login OTP for {user_id} ({participant.get('email')}): {otp}")
    print(f"[OTP] ========================================\n")
    expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=OTP_TTL_SECONDS)

    # One live code per participant. Requesting a new one drops the old, so a
    # code read over someone's shoulder stops working the moment they hit resend.
    db.delete("login_otps", f"user_id=eq.{user_id}&consumed_at=is.null")
    db.insert(
        "login_otps",
        {
            "user_id": user_id,
            "otp_hash": _hash_otp(user_id, otp),
            "expires_at": expires_at.isoformat(),
        },
    )

    sent = _send_otp_email(participant, otp)

    return {
        "registration_id": participant.get("master_qr_token"),
        "success": True,
        "email_hint": _mask_email(participant.get("email", "")),
        "expires_in": OTP_TTL_SECONDS,
        "email_sent": sent,
        "message": "We emailed you a 6-digit code.",
    }


def verify_otp(user_id: str = "", otp: str = "", *, registration_id: str = "") -> Dict[str, Any]:
    """POST /api/participant/auth/verify-otp - accepts registration_id | user_id."""
    from services.registration_state import resolve_participant

    user_id = (user_id or "").strip().upper()
    otp = (otp or "").strip()
    if not otp or not (user_id or registration_id):
        return {"success": False, "error_code": "VALIDATION_ERROR", "message": "Identifier and code are required."}

    resolved = resolve_participant(registration_id=registration_id, user_id=user_id)
    if not resolved:
        return {"success": False, "error_code": "NOT_FOUND", "message": "No registration found for that."}
    user_id = resolved["user_id"]

    row = db.select_one(
        "login_otps",
        f"select=*&user_id=eq.{user_id}&consumed_at=is.null&order=created_at.desc",
    )
    if not row:
        return {
            "success": False,
            "error_code": "OTP_NOT_FOUND",
            "message": "No active code. Request a new one.",
        }

    if row["attempts"] >= OTP_MAX_ATTEMPTS:
        db.delete("login_otps", f"id=eq.{row['id']}")
        return {
            "success": False,
            "error_code": "OTP_LOCKED",
            "message": "Too many wrong attempts. Request a new code.",
        }

    if dt.datetime.now(dt.timezone.utc) > dt.datetime.fromisoformat(row["expires_at"]):
        db.delete("login_otps", f"id=eq.{row['id']}")
        return {"success": False, "error_code": "OTP_EXPIRED", "message": "That code expired. Request a new one."}

    if not hmac.compare_digest(row["otp_hash"], _hash_otp(user_id, otp)):
        db.update("login_otps", f"id=eq.{row['id']}", {"attempts": row["attempts"] + 1})
        left = OTP_MAX_ATTEMPTS - (row["attempts"] + 1)
        return {
            "success": False,
            "error_code": "OTP_INVALID",
            "message": f"Incorrect code. {left} attempt{'s' if left != 1 else ''} left.",
        }

    db.update(
        "login_otps",
        f"id=eq.{row['id']}",
        {"consumed_at": dt.datetime.now(dt.timezone.utc).isoformat()},
    )

    from services.registration_state import public_view

    token, expires_at_ms = generate_participant_token(user_id)

    # The session carries the public view: registration_id always, the
    # participant code only once the registration is confirmed.
    return {
        "success": True,
        "token": token,
        "expires_at": expires_at_ms,
        "user": public_view(resolved, verified=True),
    }


# --- email -----------------------------------------------------------------

def _mask_email(email: str) -> str:
    if "@" not in email:
        return ""
    local, _, domain = email.partition("@")
    shown = local[:2] if len(local) > 2 else local[:1]
    return f"{shown}{'*' * max(len(local) - len(shown), 1)}@{domain}"


def _send_otp_email(participant: Dict[str, Any], otp: str) -> bool:
    """Never fatal — the participant can always request another code."""
    try:
        from services.email_service import send_simple_email

        # Plain mailer rather than the passport template: a login code has to
        # arrive fast and be readable in a notification preview, which a
        # 600-line HTML pass is not.
        return send_simple_email(
            to=participant["email"],
            subject=f"Your Zinnia 2026 login code: {otp}",
            html=(
                f"<p>Hi {participant.get('name', '')},</p><p>Your login code is <strong style='font-size:22px;letter-spacing:3px'>"
                f"{otp}</strong></p><p>It expires in "
                f"{OTP_TTL_SECONDS // 60} minutes. If you did not ask for it, you can ignore this email.</p>"
            ),
        )

    except Exception as e:
        # Swallowed deliberately: the caller reports "we emailed you a code"
        # regardless and the participant can hit resend. Raising here would
        # strand anyone whose provider is briefly refusing us.
        print(
            f"[participant_auth] OTP email not sent for {participant.get('user_id')}: "
            f"{type(e).__name__}: {e}"
        )
        if os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true":
            print(f"[participant_auth] SIMULATED OTP for {participant.get('user_id')}: {otp}")
        return False


# --- registration-time email verification -----------------------------------
#
# There is no email_verified column on zin26.participants, and every schema
# change here has to be hand-applied in the Supabase console. A consumed OTP row
# is already proof that the participant received mail at that address, so it
# doubles as the verification record with zero schema change. request_otp only
# deletes UNCONSUMED rows, so a consumed one survives later logins.


def email_is_verified(user_id: str) -> bool:
    """Kept for callers; the logic lives with the rest of the lifecycle."""
    from services.registration_state import email_is_verified as _v

    return _v(user_id)



def verify_registration_email(
    user_id: str = "", otp: str = "", *, registration_id: str = ""
) -> Dict[str, Any]:
    """
    POST /api/participant/register/verify-email

    Proves the address before payment (step 4-5 of the flow). Returns a session
    so the participant stays signed in through payment, and — because this is
    the moment the address is proven — the session now carries their UserID,
    which is the credential they will log back in with. It still sends NO
    confirmation email and still releases NO master QR or group link: those
    wait on treasurer approval (treasurer_review_payment).
    """
    from services import pending_registration as pending

    # The pending path: this call is what CREATES the registration. Everything
    # before it — the details form, the emailed code — wrote nothing.
    if pending.is_pending_token(registration_id):
        payload, reason = pending.open_token(registration_id)
        if not payload:
            return {
                "success": False,
                "error_code": "PENDING_EXPIRED" if reason == "EXPIRED" else "NOT_FOUND",
                "message": (
                    "That registration attempt expired. Fill the form again to get a new code."
                    if reason == "EXPIRED"
                    else "We could not read that registration. Fill the form again."
                ),
            }

        if pending.is_verified_payload(payload):
            # Already verified; re-submitting the same token is a refresh, not a
            # second registration. Hand the same token back rather than erroring.
            details = pending.details_of(payload)
            return {
                "success": True,
                "registration_id": registration_id,
                "details": _display_details(details),
                "message": "Email already verified. Continue to payment.",
            }

        if not pending.check_otp(payload, otp):
            # No attempt counter to bump: the token is stateless. The offline
            # guessing this would otherwise invite is what the PBKDF2 cost in
            # pending_registration is there to price out.
            return {
                "success": False,
                "error_code": "OTP_INVALID",
                "message": "Incorrect code. Check the email again, or resend the code.",
            }

        # No row is created here. The address is proven, but the registration
        # itself is not written until the payment is submitted — so someone who
        # verifies and then walks away leaves nothing behind, the same as
        # someone who abandoned the details form.
        details = pending.details_of(payload)
        return {
            "success": True,
            "registration_id": pending.mint_verified(details),
            "details": _display_details(details),
            "expires_in": pending.VERIFIED_TTL_SECONDS,
            "message": "Email verified. Complete the payment to finish registering.",
        }

    result = verify_otp(user_id, otp, registration_id=registration_id)
    if result.get("success"):
        result["message"] = "Email verified. You can proceed to payment."
    return result


def _display_details(details: Dict[str, Any]) -> Dict[str, Any]:
    """Only what the payment screen shows. No row exists to derive it from."""
    return {
        "name": details.get("name", ""),
        "email": details.get("email", ""),
        "college": details.get("college", ""),
    }


def send_pending_otp_email(details: Dict[str, Any], otp: str) -> bool:
    """
    Same mail as _send_otp_email, for someone who has no participant row yet.

    Kept separate rather than loosening _send_otp_email: that one takes a
    participant and is used by login, and a details dict is not a participant.
    """
    try:
        from services.email_service import send_simple_email

        return send_simple_email(
            to=str(details.get("email", "")),
            subject=f"Your Zinnia 2026 registration code: {otp}",
            html=(
                f"<p>Hi {details.get('name', '')},</p>"
                f"<p>Your registration code is <strong style='font-size:22px;letter-spacing:3px'>"
                f"{otp}</strong></p>"
                f"<p>Enter it on the confirmation screen to complete your registration. "
                f"It expires in 10 minutes. Your registration is not created until you enter it.</p>"
            ),
        )
    except RecipientRefused:
        # Deliberately NOT swallowed: the address does not exist, and the only
        # useful thing to do is tell the participant so they can fix it.
        raise
    except Exception as e:
        print(f"[participant_auth] pending OTP email not sent: {type(e).__name__}: {e}")
        if os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true":
            print(f"[participant_auth] SIMULATED pending OTP: {otp}")
        return False
