"""
Registration details held OUTSIDE the database until the emailed code is proven.

Why this exists
---------------
The old flow wrote zin26.participants the moment the details form was submitted,
then emailed a code. Two things were wrong with that:

  * Anyone who filled the form and closed the tab left a permanent row behind.
    Coming back and filling it in again hit the UNIQUE(email) check and was told
    "this email is already registered" — for a registration they never finished
    and cannot see. There was no way out of that except a coordinator deleting
    the row by hand.
  * The table filled with rows for people who never verified anything, so the
    treasurer's queue and every count included registrations that did not exist
    in any meaningful sense.

So nothing is written now until the code comes back. The details ride along in a
signed token instead of a "pending" table: a pending table would still be
storing unverified personal data in the database, and every schema change in
this project has to be hand-applied in the Supabase console.

The token is opaque to the browser but NOT secret — treat it as tamper-proof,
not confidential. It is signed with AUTH_SECRET_KEY, so the details inside
cannot be edited, and it carries its own expiry.

On the OTP hash
---------------
The token carries the code's hash, which means someone holding a token could
guess the six digits offline rather than against a rate-limited endpoint. A
plain SHA-256 would fall in seconds. PBKDF2 with a high iteration count is what
buys that back: one legitimate verify pays it once, while a search over all
10^6 codes costs days. That is the whole reason this is not a bare hashlib call.
"""

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional, Tuple

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not AUTH_SECRET_KEY:
    raise RuntimeError("CRITICAL SECURITY ERROR: AUTH_SECRET_KEY environment variable is missing!")

# Long enough to find the mail, short enough that a stale tab cannot be
# resurrected days later. Matches the copy on the verify screen.
PENDING_TTL_SECONDS = 10 * 60

# Once the code is proven the token has to survive the whole payment: opening a
# UPI app, paying, screenshotting, coming back. Ten minutes is nowhere near
# enough for that, and a token that lapses mid-payment strands someone who has
# already sent money.
VERIFIED_TTL_SECONDS = 6 * 60 * 60

# How long past expiry a token may still be used to RESEND a code. A lapsed
# code should cost the participant one tap, not the whole form again. Capped so
# a token found in an old tab days later cannot still trigger mail.
RESEND_GRACE_SECONDS = 24 * 60 * 60

# Cost of one verify, and of each of an attacker's 10^6 offline guesses.
_PBKDF2_ROUNDS = 240_000

# Marks our tokens so a legacy master_qr_token (a bare UUID) is never mistaken
# for one, and vice versa. Callers branch on is_pending_token().
_PREFIX = "pend1"

_FIELDS = ("name", "email", "phone", "college", "department", "year", "food_preference")


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64d(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _otp_hash(email: str, otp: str) -> str:
    """Salted by the address, so one token's hash says nothing about another's."""
    return _b64e(
        hashlib.pbkdf2_hmac(
            "sha256",
            f"{email}:{otp}".encode(),
            f"{AUTH_SECRET_KEY}:{email}".encode(),
            _PBKDF2_ROUNDS,
        )
    )


def _sign(body: str) -> str:
    return hmac.new(AUTH_SECRET_KEY.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]


def is_pending_token(value: str) -> bool:
    return (value or "").startswith(f"{_PREFIX}.")


def mint(details: Dict[str, Any], otp: str, *, ttl: int = PENDING_TTL_SECONDS) -> str:
    """Package validated details plus the code's hash into one signed string."""
    email = str(details.get("email", "")).strip().lower()
    payload = {
        "d": {k: details.get(k) for k in _FIELDS},
        "h": _otp_hash(email, otp),
        "x": int(time.time()) + ttl,
    }
    body = _b64e(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{_PREFIX}.{body}.{_sign(body)}"


def open_token(token: str, *, grace: int = 0) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Return (payload, "") or (None, reason). Signature and expiry only — the
    code itself is checked by check_otp so a wrong digit and a forged token
    give different answers to the caller.

    `grace` extends the accepted window past the token's own expiry. Resending
    passes RESEND_GRACE_SECONDS: someone whose code lapsed while they hunted
    through their inbox pressed "resend" and was told to fill the whole form
    again, which is the one moment they least deserve to lose their details.
    The signature still has to check out, so the details are as trustworthy as
    they ever were — only the clock is being forgiven. Verification passes no
    grace, so a lapsed code still cannot be used to complete a registration.
    """
    if not is_pending_token(token):
        return None, "NOT_PENDING"

    try:
        _, body, sig = token.split(".", 2)
    except ValueError:
        return None, "MALFORMED"

    # compare_digest, not ==, so a forged signature cannot be found a byte at a
    # time by timing the response.
    if not hmac.compare_digest(sig, _sign(body)):
        return None, "BAD_SIGNATURE"

    try:
        payload = json.loads(_b64d(body))
    except Exception:
        return None, "MALFORMED"

    if int(payload.get("x", 0)) + max(grace, 0) < int(time.time()):
        return None, "EXPIRED"

    return payload, ""


def mint_verified(details: Dict[str, Any]) -> str:
    """
    A token for someone whose address is proven but who has no row yet.

    Carries no OTP hash — the code has already done its job — and is marked so
    the payment endpoints can tell it apart from one still awaiting a code. The
    participant row is created from this at payment submission.
    """
    payload = {
        "d": {k: details.get(k) for k in _FIELDS},
        "v": 1,
        "x": int(time.time()) + VERIFIED_TTL_SECONDS,
    }
    body = _b64e(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{_PREFIX}.{body}.{_sign(body)}"


def is_verified_payload(payload: Dict[str, Any]) -> bool:
    return bool(payload) and int(payload.get("v", 0)) == 1


def details_of(payload: Dict[str, Any]) -> Dict[str, Any]:
    return dict(payload.get("d") or {})


def check_otp(payload: Dict[str, Any], otp: str) -> bool:
    email = str(details_of(payload).get("email", "")).strip().lower()
    expected = str(payload.get("h", ""))
    return bool(expected) and hmac.compare_digest(expected, _otp_hash(email, (otp or "").strip()))
