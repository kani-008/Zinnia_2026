"""
Zinnia 2026 — Admin Audit Log

One function, called from every mutating admin endpoint. It deliberately
swallows its own errors: a failed audit write must never fail the action it
was recording, or a Supabase hiccup blocks the treasurer mid-queue.

The table lives in `public` (migration 008) rather than zin26 — it records
admin activity, which is not participant data and outlives any one data model.
"""

from typing import Any, Dict, Optional
from urllib.parse import quote

from flask import g, request

from services.passport_service import SUPABASE_URL, get_headers
# The same kept-alive connection pool as every other Supabase call: an audit row
# is written on each desk action, and a fresh TLS handshake per row added about
# a third of a second to each one.
from services.zin26_db import http

TIMEOUT = 4


def log_action(
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    reason: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Record one admin action. Returns whether the row was written - almost every
    caller ignores that, but for LINEUP_REOPEN the row is the whole action.

    action      PAYMENT_APPROVE | PAYMENT_REJECT | EVENT_CLOSE | EXPORT | ...
    target_type participant | event | team | registration | setting
    """
    try:
        admin = getattr(g, "admin", None) or {}
        r = http.post(
            f"{SUPABASE_URL}/rest/v1/admin_audit_log",
            headers=get_headers(prefer_return="minimal"),
            timeout=TIMEOUT,
            json={
                "admin_id": str(admin.get("id", "unknown")),
                "admin_name": admin.get("name", "unknown"),
                "action": action,
                "target_type": target_type,
                "target_id": str(target_id) if target_id else None,
                "reason": reason,
                "detail": detail,
                "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
            },
        )
        if r.status_code in (200, 201, 204):
            return True
        print(f"[Audit] write refused for {action}: HTTP {r.status_code} {r.text[:200]}")
        return False
    except Exception as e:  # noqa: BLE001 — never re-raise, see module docstring
        print(f"[Audit] write failed for {action}: {type(e).__name__}: {e}")
        return False


def latest_at(action: str, target_type: str, target_id: str) -> Optional[str]:
    """
    When `action` was last recorded against this target, or None.

    For the few actions that are also state something else has to see -
    LINEUP_REOPEN is read by the participant dashboard. Never raises: None is
    "not known", which callers treat the same as "never happened".
    """
    try:
        r = http.get(
            f"{SUPABASE_URL}/rest/v1/admin_audit_log?select=created_at"
            f"&action=eq.{quote(action, safe='')}"
            f"&target_type=eq.{quote(target_type, safe='')}"
            f"&target_id=eq.{quote(str(target_id), safe='')}"
            f"&order=created_at.desc&limit=1",
            headers=get_headers(),
            timeout=TIMEOUT,
        )
        rows = r.json() if r.status_code == 200 else []
        return rows[0].get("created_at") if rows else None
    except Exception as e:  # noqa: BLE001
        print(f"[Audit] read of {action} for {target_id} failed: {type(e).__name__}: {e}")
        return None


def recent(limit: int = 50, offset: int = 0) -> list:
    """Read the log back for the audit screen."""
    try:
        r = http.get(
            f"{SUPABASE_URL}/rest/v1/admin_audit_log"
            f"?select=*&order=created_at.desc&limit={int(limit)}&offset={int(offset)}",
            headers=get_headers(),
            timeout=TIMEOUT + 4,
        )
        return r.json() if r.status_code == 200 else []
    except Exception as e:  # noqa: BLE001
        print(f"[Audit] read failed: {type(e).__name__}: {e}")
        return []
