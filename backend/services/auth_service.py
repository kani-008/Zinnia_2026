"""
Zinnia 2026 — Admin Authentication Service Layer
Authenticates organizers & coordinators using bcrypt password verification
against admin_users and event_coordinators database tables.
"""

import os
import bcrypt
import requests
from typing import Dict, Any, List, Optional
from services.passport_service import get_headers, SUPABASE_URL
from middleware.auth_middleware import generate_admin_token

# Fallback seed credentials in case database migration is pending
SEED_ADMINS = {
    "superadmin": {
        "id": "usr_superadmin",
        "username": "superadmin",
        "password_hash": "$2b$12$ntA9ni7LOB9MglGNQqVOQe7c7VhrY1PLdrcprJOYQQziOnA.ZSEBi", # Admin@Zinnia2026
        "name": "System Administrator",
        "role": "SUPER_ADMIN",
        "allowed_events": []
    },
    "treasurer": {
        "id": "usr_treasurer",
        "username": "treasurer",
        "password_hash": "$2b$12$tHli2PSFjQeFM4sygBRKL.V7i8nJ3P8WWpWqaeHG4gKhG1XT79GJW", # Treasurer@Zin26
        "name": "Main Treasurer",
        "role": "TREASURER",
        "allowed_events": []
    },
    "gate1": {
        "id": "usr_gate1",
        "username": "gate1",
        "password_hash": "$2b$12$eO7L1ljlSNGYmtiCQuFsuemnmXM.eNXkRezvMQawXr925oTP4F46W", # GatePass@Zin26
        "name": "Main Gate Terminal 1",
        "role": "GATE_ADMIN",
        "allowed_events": []
    },
    "food1": {
        "id": "usr_food1",
        "username": "food1",
        "password_hash": "$2b$12$avNSuVmeYDmDV/nUwq/PquHlf1KpAj/9MVRm/Kegb8fKFgUhr..DO", # FoodPass@Zin26
        "name": "Food Counter Terminal 1",
        "role": "FOOD_ADMIN",
        "allowed_events": []
    }
}

# 18 coordinators mapping event IDs
EVENT_COORDINATOR_MAPPINGS = {
    "debugging1": ("debugging", "Prabakaran D"),
    "debugging2": ("debugging", "Deepakala"),
    "signal1": ("the-last-signal", "Abdul Razith"),
    "signal2": ("the-last-signal", "Sri Karthika"),
    "sql1": ("lost-at-sql", "Vignesh"),
    "sql2": ("lost-at-sql", "Indhumathi"),
    "gadget1": ("gadget-codes", "Muhammed Umer"),
    "gadget2": ("gadget-codes", "Swathi"),
    "paper1": ("paper-presentation", "Kanishkar"),
    "paper2": ("paper-presentation", "Karishma"),
    "borderland1": ("borderland-at-gcee", "Praveenraja"),
    "borderland2": ("borderland-at-gcee", "Kaviyasri"),
    "strike1": ("think-strike-and-win", "Sivabalan"),
    "strike2": ("think-strike-and-win", "Yogeshwari"),
    "plottwist1": ("plot-twist", "Hariharan"),
    "plottwist2": ("plot-twist", "Akshaya"),
    "film1": ("short-flim", "Aswin Sanjeev Kumar"),
    "film2": ("short-flim", "Harshini")
}

DEFAULT_COORD_HASH = "$2b$12$BDdAMNLQx/R2WDCZB9PjbexYpAhtFUeWz8/WCXtZ4PznjGGA3hN3O" # Coord@Zin26

def authenticate_admin(username_or_email: str, password: str) -> Dict[str, Any]:
    """Authenticates admin or coordinator and returns profile with assigned event tracks."""
    cleaned_user = (username_or_email or "").strip().lower()
    provided_pass = (password or "").strip()

    if not cleaned_user or not provided_pass:
        return {"success": False, "error_code": "INVALID_INPUT", "message": "Username and password are required."}

    headers = get_headers()
    user_record = None
    allowed_events = []

    # 1. Look up in Supabase admin_users table
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/admin_users?username=eq.{cleaned_user}&select=*&is_active=eq.true",
            headers=headers,
            timeout=4
        )
        if r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0:
            user_record = r.json()[0]
    except Exception as e:
        print(f"[Auth DB Error] Query failed: {e}")

    # Fallback to in-memory seeds if not yet populated in DB
    if not user_record:
        if cleaned_user in SEED_ADMINS:
            user_record = SEED_ADMINS[cleaned_user]
        elif cleaned_user in EVENT_COORDINATOR_MAPPINGS:
            ev_id, coord_name = EVENT_COORDINATOR_MAPPINGS[cleaned_user]
            user_record = {
                "id": f"usr_{cleaned_user}",
                "username": cleaned_user,
                "password_hash": DEFAULT_COORD_HASH,
                "name": coord_name,
                "role": "EVENT_COORDINATOR",
                "allowed_events": [ev_id]
            }

    if not user_record:
        return {"success": False, "error_code": "INVALID_CREDENTIALS", "message": "Invalid username or credentials."}

    # Verify bcrypt password hash
    stored_hash = user_record.get("password_hash", "")
    is_valid = False
    try:
        if stored_hash:
            is_valid = bcrypt.checkpw(provided_pass.encode("utf-8"), stored_hash.encode("utf-8"))
    except Exception as err:
        print(f"[Bcrypt Error] {err}")
        is_valid = False

    if not is_valid:
        return {"success": False, "error_code": "INVALID_CREDENTIALS", "message": "Invalid username or password."}

    # Fetch coordinator's assigned events
    user_role = user_record.get("role", "").upper()
    if user_role == "EVENT_COORDINATOR":
        if "allowed_events" in user_record and user_record["allowed_events"]:
            allowed_events = user_record["allowed_events"]
        else:
            try:
                user_id = user_record["id"]
                ec_r = requests.get(
                    f"{SUPABASE_URL}/rest/v1/event_coordinators?admin_user_id=eq.{user_id}&select=event_id,events(id,code,mission_name,title)",
                    headers=headers,
                    timeout=3
                )
                if ec_r.status_code == 200 and isinstance(ec_r.json(), list):
                    allowed_events = [item.get("event_id") for item in ec_r.json() if item.get("event_id")]
            except Exception:
                pass

            if not allowed_events and cleaned_user in EVENT_COORDINATOR_MAPPINGS:
                allowed_events = [EVENT_COORDINATOR_MAPPINGS[cleaned_user][0]]

    user_profile = {
        "id": str(user_record.get("id")),
        "username": user_record.get("username"),
        "name": user_record.get("name"),
        "role": user_role,
        "allowed_events": allowed_events
    }

    token = generate_admin_token(user_profile)

    return {
        "success": True,
        "message": f"Authenticated successfully as {user_profile['name']}.",
        "user": user_profile,
        "allowed_events": allowed_events,
        "token": token
    }
