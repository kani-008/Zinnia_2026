"""
Zinnia 2026 — Admin Authentication & RBAC Middleware
Validates HMAC-SHA256 signed bearer tokens and enforces role-based access control.
"""

import os
import hmac
import hashlib
import json
import base64
import time
from functools import wraps
from flask import request, jsonify, g

from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
if not AUTH_SECRET_KEY:
    raise RuntimeError("CRITICAL SECURITY ERROR: AUTH_SECRET_KEY environment variable is missing!")

def generate_admin_token(user_data: dict, expires_in_seconds: int = 86400 * 7) -> str:
    """Generate a tamper-proof HMAC-signed token for an admin user."""
    payload = {
        "id": str(user_data.get("id", "")),
        "username": user_data.get("username", ""),
        "role": user_data.get("role", ""),
        "name": user_data.get("name", ""),
        "allowed_events": user_data.get("allowed_events", []),
        "exp": int(time.time()) + expires_in_seconds
    }
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip("=")
    signature = hmac.new(AUTH_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_admin_token(token: str) -> tuple[bool, dict, str]:
    """Verify and decode HMAC-signed token."""
    if not token or "." not in token:
        return False, {}, "Malformed token format."
    
    parts = token.split(".")
    if len(parts) != 2:
        return False, {}, "Invalid token structure."
    
    payload_b64, signature = parts
    expected_sig = hmac.new(AUTH_SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        return False, {}, "Invalid token signature."
    
    try:
        # Pad base64 string
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        payload = json.loads(payload_json)
        
        if payload.get("exp", 0) < time.time():
            return False, {}, "Session expired. Please sign in again."
        
        return True, payload, "Valid"
    except Exception as e:
        return False, {}, f"Token decode error: {str(e)}"

# Every role an admin token is ever issued with (auth_service: admin_users and
# the seed accounts). An allow-list, not a signature check alone: participant
# sessions are signed with the same AUTH_SECRET_KEY in the same payload.signature
# format - {"sub", "aud": "participant", "exp"}, no role - so a valid signature
# proves nothing about being an admin. Without this, any registered participant
# could send their own session token to require_auth routes and download the
# full participant export.
ADMIN_ROLES = frozenset({
    "SUPER_ADMIN", "TREASURER", "GATE_ADMIN", "FOOD_ADMIN", "EVENT_COORDINATOR", "SPOT_DESK",
})


def get_current_admin():
    """Extract authenticated admin from request headers."""
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif request.cookies.get("admin_token"):
        token = request.cookies.get("admin_token")
    
    if not token:
        return None
    
    valid, user, _ = decode_admin_token(token)
    if not valid:
        return None
    # A token meant for another audience, or with no admin role, is not an admin.
    if user.get("aud") or str(user.get("role", "")).upper() not in ADMIN_ROLES:
        return None
    return user

# Standalone key for the Google Sheets sync. Deliberately NOT an admin token:
# an admin token is revoked only by rotating AUTH_SECRET_KEY, which signs out all
# 24 accounts mid-event, and any valid admin token opens every require_auth route.
# This one is revoked by editing a single environment variable and opens exactly
# one endpoint. Unset means the sync is off, which is the right default.
SHEET_SYNC_KEY = os.getenv("SHEET_SYNC_KEY", "")


def require_sync_key(f):
    """Guard for the read-only Google Sheets export endpoint."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not SHEET_SYNC_KEY:
            return jsonify({
                "success": False,
                "error_code": "SYNC_DISABLED",
                "message": "Sheet sync is not configured on this deployment.",
            }), 503

        supplied = request.headers.get("Authorization", "")
        if supplied[:7].lower() == "bearer ":
            supplied = supplied[7:]
        supplied = supplied.strip()

        # compare_digest, not ==: a plain string comparison returns on the first
        # wrong byte, which leaks the key one character at a time to anyone
        # willing to time the responses.
        if not supplied or not hmac.compare_digest(supplied, SHEET_SYNC_KEY):
            return jsonify({
                "success": False,
                "error_code": "UNAUTHORIZED",
                "message": "Invalid sync key.",
            }), 401

        # Full scope on purpose: the sheet mirrors the whole export. Role checks
        # in _collect_sheets narrow EVENT_COORDINATOR, and this is not one.
        g.admin = {
            "id": "sheet-sync",
            "username": "sheet-sync",
            "name": "Google Sheets sync",
            "role": "SHEET_SYNC",
            "allowed_events": [],
        }
        return f(*args, **kwargs)
    return wrapper


# Logins that may use the on-spot desk and nothing else. require_auth ("any
# signed-in admin") does not admit them: every route behind it shows or exports
# data - the dashboard, event rosters, the full participant workbook - that a
# desk login has no business seeing. They reach the desk through require_role
# routes that name them, and /api/admin/me through require_signed_in.
DESK_ONLY_ROLES = frozenset({"SPOT_DESK"})


def require_signed_in(f):
    """Any valid admin session, desk-only logins included. For /api/admin/me only."""
    @wraps(f)
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            return jsonify({"success": False, "error_code": "UNAUTHORIZED", "message": "Authentication required. Please sign in."}), 401
        g.admin = admin
        return f(*args, **kwargs)
    return decorated


def require_auth(f):
    """Middleware enforcing valid admin session. Desk-only logins are refused."""
    @wraps(f)
    def decorated(*args, **kwargs):
        admin = get_current_admin()
        if not admin:
            return jsonify({"success": False, "error_code": "UNAUTHORIZED", "message": "Authentication required. Please sign in."}), 401
        if str(admin.get("role", "")).upper() in DESK_ONLY_ROLES:
            return jsonify({
                "success": False,
                "error_code": "FORBIDDEN",
                "message": "This login is for the on-spot desk only.",
            }), 403
        g.admin = admin
        return f(*args, **kwargs)
    return decorated

def require_role(*allowed_roles):
    """Middleware restricting route to specific admin roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            admin = get_current_admin()
            if not admin:
                return jsonify({"success": False, "error_code": "UNAUTHORIZED", "message": "Authentication required."}), 401
            
            user_role = admin.get("role", "").upper()
            if user_role != "SUPER_ADMIN" and user_role not in [r.upper() for r in allowed_roles]:
                return jsonify({
                    "success": False, 
                    "error_code": "FORBIDDEN", 
                    "message": f"Access denied. Required role: {', '.join(allowed_roles)} (current: {user_role})."
                }), 403
            
            g.admin = admin
            return f(*args, **kwargs)
        return decorated
    return decorator
