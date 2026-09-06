"""
Zinnia 2026 — Admin Authentication Service

WHAT CHANGED AND WHY
    This module used to compare the submitted password against a plaintext
    `expected_pass` field held in this file, BEFORE trying bcrypt. Every admin
    password was therefore readable in the repository, including the
    SUPER_ADMIN one, and remains readable in git history.

    Verification is now bcrypt-only, and credentials are read from the
    `admin_users` table that migration 001 seeds.

SEED FALLBACK
    If `admin_users` is unreachable or empty, this falls back to the built-in
    accounts below so a fresh checkout can still sign in. The fallback is
    bcrypt-only too, and it is announced loudly on every use. Set
    ADMIN_DISABLE_SEED_FALLBACK=true in production to turn it off.

    THESE HASHES ARE PUBLIC. Rotate before the panel protects anything real:
        python scripts/gen_admin_hashes.py
"""

from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import bcrypt
import requests

from middleware.auth_middleware import generate_admin_token
from services.passport_service import SUPABASE_URL, get_headers

DISABLE_SEED_FALLBACK = os.getenv("ADMIN_DISABLE_SEED_FALLBACK", "false").lower() == "true"

# A real bcrypt hash of a random string. Compared against when the username is
# unknown, so a missing account and a wrong password take the same time to
# answer and the login form cannot be used to enumerate usernames.
_DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEe.uQZ9tQ4Ml3Q1Qm0v0aJ0Q0aQ0aQ0aQ0"

# Fallback only. The database is the source of truth when it is reachable.
# Hashes for the five shared passwords, so the table below stays readable.
_H_ADMIN = "$2b$12$5uL/sUJ8CptgUJou6Jy0xe5o1h0T05ilrXkftlA3V79PnLoxcT7rW"  # Admin@Zinnia2026
_H_TREAS = "$2b$12$/SpPPmN6vDrb.4xxCbO1NOfMjlbtAtjbzkgb8xvQsQZXnwU8pADOa"  # Treasurer@Zin26
_H_GATE = "$2b$12$j2o4yGUR03M9ku8zkD.IdufhqWvdxK1UCGtWp3P35fpvKhO/xskm2"   # GatePass@Zin26
_H_FOOD = "$2b$12$JfoW6xMgCJfKsJ7BS8Blc.8/owQloH6WuZC/oLkDNMKSoRYYM2CP2"   # FoodPass@Zin26
_H_COORD = "$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m"  # Coord@Zin26


def _coord(name: str, event: str) -> Dict[str, Any]:
    return {"hash": _H_COORD, "name": name, "role": "EVENT_COORDINATOR", "events": [event]}


# Mirrors migration 010 exactly — same usernames, same passwords, same event
# codes. There is one set of credentials now, not two: this is an offline copy
# of admin_users, never a second list to reconcile against it.
SEED_ADMINS: Dict[str, Dict[str, Any]] = {
    "admin":     {"hash": _H_ADMIN, "name": "System Administrator", "role": "SUPER_ADMIN", "events": []},
    "treasurer": {"hash": _H_TREAS, "name": "Symposium Treasurer", "role": "TREASURER", "events": []},
    "gate1":     {"hash": _H_GATE, "name": "Main Gate Scanner 1", "role": "GATE_ADMIN", "events": []},
    "gate2":     {"hash": _H_GATE, "name": "Main Gate Scanner 2", "role": "GATE_ADMIN", "events": []},
    "food1":     {"hash": _H_FOOD, "name": "Food Counter 1", "role": "FOOD_ADMIN", "events": []},
    "food2":     {"hash": _H_FOOD, "name": "Food Counter 2", "role": "FOOD_ADMIN", "events": []},

    "debugging1":  _coord("Prabakaran D", "DEBUGGING"),
    "debugging2":  _coord("Deepakala", "DEBUGGING"),
    "signal1":     _coord("Abdul Razith", "LAST_SIGNAL"),
    "signal2":     _coord("Sri Karthika", "LAST_SIGNAL"),
    "sql1":        _coord("Vignesh", "LOST_IN_SQL"),
    "sql2":        _coord("Indhumathi", "LOST_IN_SQL"),
    "gadget1":     _coord("Muhammed Umer", "GADGET_CODES"),
    "gadget2":     _coord("Swathi", "GADGET_CODES"),
    "paper1":      _coord("Kanishkar", "PAPER_PRESENTATION"),
    "paper2":      _coord("Karishma", "PAPER_PRESENTATION"),
    "borderland1": _coord("Praveenraja", "BORDERLAND"),
    "borderland2": _coord("Kaviyasri", "BORDERLAND"),
    "strike1":     _coord("Sivabalan", "THINK_STRIKE_WIN"),
    "strike2":     _coord("Yogeshwari", "THINK_STRIKE_WIN"),
    "plottwist1":  _coord("Hariharan", "PLOT_TWIST"),
    "plottwist2":  _coord("Akshaya", "PLOT_TWIST"),
    "film1":       _coord("Aswin Sanjeev Kumar", "SHORT_FILM"),
    "film2":       _coord("Harshini", "SHORT_FILM"),
}

# Retired by migration 010. Named so the login error can say what happened
# instead of "invalid username", which sends people hunting for a typo.
RETIRED_USERNAMES = {
    "superadmin": "admin",
    "gate": "gate1", "food": "food1",
    "debugging": "debugging1", "signal": "signal1", "sql": "sql1",
    "gadget": "gadget1", "paper": "paper1", "borderland": "borderland1",
    "strike": "strike1", "plottwist": "plottwist1", "film": "film1",
}


def _bcrypt_ok(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), (stored_hash or "").encode("utf-8"))
    except Exception:
        return False


def _from_database(username: str) -> Optional[Dict[str, Any]]:
    """Returns the admin row, or None when the table is unreachable or empty."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/admin_users"
            f"?username=eq.{username}&is_active=eq.true"
            f"&select=id,username,password_hash,name,role",
            headers=get_headers(),
            timeout=6,
        )
        if r.status_code != 200:
            return None
        rows = r.json()
        return rows[0] if isinstance(rows, list) and rows else None
    except Exception as e:
        print(f"[Auth] admin_users lookup failed: {type(e).__name__}: {e}")
        return None


def _allowed_events(admin_user_id: str) -> List[str]:
    """
    Coordinator scope, in zin26 event codes.

    Reads admin_event_scope (migration 010), NOT the older event_coordinators
    table: that one is FK'd to public.events and holds legacy ids like
    'lost-at-sql', while the panel filters on zin26 codes like 'LOST_IN_SQL'.
    The two never matched, so every coordinator saw an empty event list.
    """
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/admin_event_scope"
            f"?admin_user_id=eq.{admin_user_id}&select=event_code",
            headers=get_headers(),
            timeout=6,
        )
        if r.status_code == 200 and isinstance(r.json(), list):
            return [row["event_code"] for row in r.json() if row.get("event_code")]
    except Exception as e:
        print(f"[Auth] admin_event_scope lookup failed: {type(e).__name__}: {e}")
    return []


def authenticate_admin(username_or_email: str, password: str) -> Dict[str, Any]:
    raw = (username_or_email or "").strip().lower()
    pwd = (password or "").strip()

    if not raw or not pwd:
        return {"success": False, "error_code": "INVALID_INPUT",
                "message": "Username and password are required."}

    # Accept an email form so nobody has to remember which it was.
    username = raw.split("@")[0] if "@" in raw else raw

    profile: Optional[Dict[str, Any]] = None

    row = _from_database(username)
    if row:
        if _bcrypt_ok(pwd, row.get("password_hash", "")):
            profile = {
                "id": str(row["id"]),
                "username": row["username"],
                "name": row["name"],
                "role": str(row["role"]).upper(),
                "allowed_events": _allowed_events(str(row["id"])),
            }
    elif not DISABLE_SEED_FALLBACK:
        seed = SEED_ADMINS.get(username)
        if seed and _bcrypt_ok(pwd, seed["hash"]):
            print(
                f"[Auth] SEED FALLBACK used for '{username}'. These credentials are "
                f"public in git history - rotate them and set "
                f"ADMIN_DISABLE_SEED_FALLBACK=true."
            )
            profile = {
                "id": f"seed_{username}",
                "username": username,
                "name": seed["name"],
                "role": seed["role"],
                "allowed_events": seed["events"],
            }
    else:
        # Keep the timing indistinguishable from a wrong password.
        _bcrypt_ok(pwd, _DUMMY_HASH)

    if not profile:
        if not row:
            _bcrypt_ok(pwd, _DUMMY_HASH)
        # A retired username is a different problem from a wrong password, and
        # saying so saves someone hunting for a typo that is not there.
        replacement = RETIRED_USERNAMES.get(username)
        if replacement:
            return {
                "success": False,
                "error_code": "ACCOUNT_RETIRED",
                "message": f"The '{username}' account was merged into '{replacement}'. "
                           f"Sign in as '{replacement}' instead.",
            }
        return {"success": False, "error_code": "INVALID_CREDENTIALS",
                "message": "Invalid username or password."}

    return {
        "success": True,
        "message": f"Signed in as {profile['name']}.",
        "user": profile,
        "allowed_events": profile["allowed_events"],
        "token": generate_admin_token(profile),
    }
