"""
Zinnia 2026 — zin26 schema data-access helpers.

Every new-model table lives in the `zin26` Postgres schema, not `public`
(see supabase/PHASE1_NOTES.md). PostgREST selects a non-default schema per
request via the `Accept-Profile` header on reads and `Content-Profile` on
writes, so all zin26 traffic goes through the helpers here rather than the
bare `get_headers()` used by the legacy public-schema services.

PREREQUISITE: `zin26` must be listed under Supabase Dashboard -> Settings ->
API -> Exposed schemas. Until it is, every call here returns PGRST106
("Invalid schema") and `zin26_available()` reports False.
"""

import os
from typing import Any, Dict, List, Optional, Tuple

import requests

from services.passport_service import SUPABASE_URL, SUPABASE_KEY

SCHEMA = "zin26"
TIMEOUT = 8


def _base_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }


def read_headers() -> Dict[str, str]:
    h = _base_headers()
    h["Accept-Profile"] = SCHEMA
    return h


def write_headers(prefer: str = "return=representation") -> Dict[str, str]:
    h = _base_headers()
    h["Content-Profile"] = SCHEMA
    h["Prefer"] = prefer
    return h


def _url(table: str, query: str = "") -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}{'?' + query if query else ''}"


class Zin26Error(Exception):
    """Raised when a zin26 call fails in a way the caller must surface."""

    def __init__(self, message: str, status: int = 500, code: str = "DB_ERROR"):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


def zin26_available() -> Tuple[bool, str]:
    """
    Cheap probe used at startup and by the health endpoint.

    Returns (ok, detail). Distinguishes "schema not exposed" from "unreachable",
    because the former is a one-click dashboard fix and the latter is not.
    """
    try:
        r = requests.get(
            _url("events", "select=code&limit=1"), headers=read_headers(), timeout=TIMEOUT
        )
    except Exception as e:
        return False, f"unreachable: {type(e).__name__}: {e}"

    if r.status_code == 200:
        return True, "ok"
    if "PGRST106" in r.text:
        return (
            False,
            "schema 'zin26' is not exposed - add it under Supabase Dashboard -> Settings -> API -> Exposed schemas",
        )
    return False, f"HTTP {r.status_code}: {r.text[:200]}"


def select(table: str, query: str = "select=*") -> List[Dict[str, Any]]:
    r = requests.get(_url(table, query), headers=read_headers(), timeout=TIMEOUT)
    if r.status_code not in (200, 206):
        raise Zin26Error(f"select {table} failed: HTTP {r.status_code} {r.text[:200]}")
    return r.json() or []


def select_one(table: str, query: str) -> Optional[Dict[str, Any]]:
    rows = select(table, query if "limit=" in query else f"{query}&limit=1")
    return rows[0] if rows else None


def insert(table: str, payload: Any) -> List[Dict[str, Any]]:
    r = requests.post(_url(table), headers=write_headers(), json=payload, timeout=TIMEOUT)
    if r.status_code not in (200, 201):
        # 23505 is Postgres' unique_violation. It is surfaced as a distinct code
        # because callers act on it — a duplicate email or a second team entry for
        # the same event is a message to the participant, not a server error.
        if "23505" in r.text:
            raise Zin26Error(f"duplicate: {r.text[:200]}", status=409, code="DUPLICATE")
        raise Zin26Error(f"insert {table} failed: HTTP {r.status_code} {r.text[:200]}")
    return r.json() or []


def update(table: str, query: str, payload: Any) -> List[Dict[str, Any]]:
    r = requests.patch(_url(table, query), headers=write_headers(), json=payload, timeout=TIMEOUT)
    if r.status_code not in (200, 204):
        raise Zin26Error(f"update {table} failed: HTTP {r.status_code} {r.text[:200]}")
    return (r.json() or []) if r.text else []


def delete(table: str, query: str) -> List[Dict[str, Any]]:
    if not query:
        raise Zin26Error("refusing an unfiltered delete", status=400, code="UNSAFE_DELETE")
    r = requests.delete(_url(table, query), headers=write_headers(), timeout=TIMEOUT)
    if r.status_code not in (200, 204):
        raise Zin26Error(f"delete {table} failed: HTTP {r.status_code} {r.text[:200]}")
    return (r.json() or []) if r.text else []


def count(table: str, query: str = "select=*") -> int:
    h = read_headers()
    h["Prefer"] = "count=exact"
    h["Range"] = "0-0"
    r = requests.get(_url(table, query), headers=h, timeout=TIMEOUT)
    cr = r.headers.get("content-range", "")
    if "/" in cr:
        tail = cr.split("/")[-1]
        if tail.isdigit():
            return int(tail)
    return 0


# --- Supabase Storage (payment proof screenshots) -----------------------------
#
# zin26.payments already has a screenshot_url column; this is what fills it.
# The bucket is PRIVATE: the object path is stored, and the admin panel mints a
# signed URL when a treasurer needs to look at a proof.

PROOF_BUCKET = "payment-proofs"
PROOF_MAX_BYTES = 5 * 1024 * 1024
PROOF_MIME_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def _storage_headers(content_type: Optional[str] = None) -> Dict[str, str]:
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    if content_type:
        h["Content-Type"] = content_type
    return h


def ensure_proof_bucket() -> None:
    """Create the private bucket on first use; a 409 means it already exists."""
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/bucket",
        headers=_storage_headers("application/json"),
        json={
            "id": PROOF_BUCKET,
            "name": PROOF_BUCKET,
            "public": False,
            "file_size_limit": PROOF_MAX_BYTES,
            "allowed_mime_types": list(PROOF_MIME_EXT),
        },
        timeout=TIMEOUT,
    )
    # Supabase reports "already exists" as HTTP 400 with a 409/BucketAlreadyExists
    # body, so the body has to be inspected, not just the status line.
    exists = r.status_code in (200, 201) or "BucketAlreadyExists" in r.text or '"409"' in r.text
    if not exists:
        raise Zin26Error(f"Could not prepare the proof bucket: {r.text[:200]}", 502, "STORAGE_ERROR")


def upload_file(path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to the proof bucket; returns the stored object path."""
    ensure_proof_bucket()
    h = _storage_headers(content_type)
    h["x-upsert"] = "true"
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{PROOF_BUCKET}/{path}",
        headers=h,
        data=data,
        timeout=max(TIMEOUT, 30),
    )
    if r.status_code not in (200, 201):
        raise Zin26Error(f"Screenshot upload failed: {r.text[:200]}", 502, "STORAGE_ERROR")
    return f"{PROOF_BUCKET}/{path}"


def sign_file_url(object_path: str, expires_in: int = 3600) -> Optional[str]:
    """Short-lived URL for a private object (for the admin panel / status page)."""
    if not object_path or "/" not in object_path:
        return None
    bucket, _, key = object_path.partition("/")
    r = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/sign/{bucket}/{key}",
        headers=_storage_headers("application/json"),
        json={"expiresIn": expires_in},
        timeout=TIMEOUT,
    )
    if r.status_code != 200:
        return None
    signed = r.json().get("signedURL") or r.json().get("signedUrl")
    return f"{SUPABASE_URL}/storage/v1{signed}" if signed else None
