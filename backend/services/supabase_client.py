"""
Zinnia 2026 — Thin PostgREST Client

There is no Postgres driver in this project. Every database call is an HTTP
request to Supabase's REST layer with the service-role key, so "run a query"
means one of two things:

    a VIEW      -> GET  /rest/v1/v_name?select=*
    a FUNCTION  -> POST /rest/v1/rpc/fn_name   (JSON body)

The important consequence: two calls are two requests and are NOT atomic.
Anything that must not race belongs inside a single PL/pgSQL function.
"""

import requests
from typing import Any, Dict, List, Optional, Tuple

from services.passport_service import get_headers, SUPABASE_URL

DEFAULT_TIMEOUT = 8


def _url(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}"


def get(path: str, timeout: int = DEFAULT_TIMEOUT) -> Tuple[bool, Any]:
    """GET a table, view or filtered collection. Returns (ok, rows)."""
    try:
        r = requests.get(_url(path), headers=get_headers(), timeout=timeout)
        if r.status_code == 200:
            return True, r.json()
        print(f"[Supabase GET {r.status_code}] {path} :: {r.text[:200]}")
        return False, []
    except Exception as e:
        print(f"[Supabase GET error] {path} :: {e}")
        return False, []


def get_one(path: str) -> Optional[Dict[str, Any]]:
    ok, rows = get(path)
    if ok and isinstance(rows, list) and rows:
        return rows[0]
    return None


def count(path: str) -> int:
    """Exact row count without pulling the rows themselves."""
    try:
        headers = dict(get_headers())
        headers["Prefer"] = "count=exact"
        headers["Range"] = "0-0"
        r = requests.get(_url(path), headers=headers, timeout=DEFAULT_TIMEOUT)
        # PostgREST answers with Content-Range: 0-0/<total>
        cr = r.headers.get("Content-Range", "")
        if "/" in cr:
            total = cr.split("/")[-1]
            return int(total) if total.isdigit() else 0
    except Exception as e:
        print(f"[Supabase count error] {path} :: {e}")
    return 0


def patch(path: str, payload: Dict[str, Any]) -> Tuple[bool, Any]:
    """PATCH rows. Returns (ok, updated_rows) — the rows matter for guarded
    transitions: an empty list means the WHERE clause matched nothing, which
    is how a lost race is detected."""
    try:
        r = requests.patch(_url(path), headers=get_headers(),
                           json=payload, timeout=DEFAULT_TIMEOUT)
        if r.status_code in (200, 201, 204):
            body = r.json() if r.text else []
            return True, body if isinstance(body, list) else [body]
        print(f"[Supabase PATCH {r.status_code}] {path} :: {r.text[:200]}")
        return False, []
    except Exception as e:
        print(f"[Supabase PATCH error] {path} :: {e}")
        return False, []


def post(path: str, payload: Any) -> Tuple[bool, Any]:
    try:
        r = requests.post(_url(path), headers=get_headers(),
                          json=payload, timeout=DEFAULT_TIMEOUT)
        if r.status_code in (200, 201, 204):
            return True, (r.json() if r.text else {})
        print(f"[Supabase POST {r.status_code}] {path} :: {r.text[:200]}")
        return False, {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        print(f"[Supabase POST error] {path} :: {e}")
        return False, {"error": str(e)}


def rpc(fn: str, payload: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any]:
    """Call a PL/pgSQL function. This is the only way to get a transaction."""
    return post(f"rpc/{fn}", payload or {})


# ------------------------------------------------------------------------------
# app_settings helpers — small enough to read on demand, no caching layer
# ------------------------------------------------------------------------------
def get_settings() -> Dict[str, Any]:
    ok, rows = get("app_settings?select=key,value")
    if not ok or not isinstance(rows, list):
        return {}
    return {r["key"]: r["value"] for r in rows if "key" in r}


def get_setting(key: str, default: Any = None) -> Any:
    row = get_one(f"app_settings?key=eq.{key}&select=value")
    return row["value"] if row else default
