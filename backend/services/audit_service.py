"""
Zinnia 2026 — Admin Audit Log

One function, called from every mutating admin endpoint. It deliberately
swallows its own errors: a failed audit write must never fail the action it
was recording, or a Supabase hiccup blocks the treasurer mid-queue.

The table lives in `public` (migration 008) rather than zin26 — it records
admin activity, which is not participant data and outlives any one data model.
"""

from typing import Any, Dict, Optional

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
) -> None:
    """
    Record one admin action.

    action      PAYMENT_APPROVE | PAYMENT_REJECT | EVENT_CLOSE | EXPORT | ...
    target_type participant | event | team | registration | setting
    """
    try:
        admin = getattr(g, "admin", None) or {}
        http.post(
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
    except Exception as e:  # noqa: BLE001 — never re-raise, see module docstring
        print(f"[Audit] write failed for {action}: {type(e).__name__}: {e}")


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
