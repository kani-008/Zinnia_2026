"""
Payment screenshots in Google Drive instead of Supabase Storage.

Storage format
--------------
zin26.payments.screenshot_url holds "gdrive:<fileId>" for anything stored here.
Supabase object paths ("payment-proofs/...") stay exactly as they were, so
proofs uploaded before this switch keep working — every reader branches on the
prefix rather than assuming one backend. No migration, no backfill.

Serving
-------
Drive links are NOT used to display the image. drive.google.com/uc?export=view
is rate-limited and frequently returns an interstitial instead of bytes, and
lh3.googleusercontent.com URLs expire — either would hang the treasurer's panel
on exactly the images it needs most. So the file is streamed back through this
server, addressed by a short-lived signed token. That also means the Drive
folder never has to be public: it can be set back to private.

The token goes in a query string because an <img src> cannot carry an
Authorization header. It is signed with AUTH_SECRET_KEY and expires, so it
grants one file for a few minutes and nothing else.
"""

import base64
import hashlib
import hmac
import json
import os
import re
import time
from collections import OrderedDict
from typing import Optional, Tuple

import requests

FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "").strip()
CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
REFRESH_TOKEN = os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", "").strip()

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY") or ""

PREFIX = "gdrive:"
TIMEOUT = 30

# Google's own request timeout. Vercel kills the function at maxDuration
# (30s in vercel.json), so a 60s read timeout can never fire there - the
# platform would return a timeout the code never sees and nothing is logged.
FETCH_TIMEOUT = int(os.getenv("DRIVE_FETCH_TIMEOUT", "20"))

# The token exchange is a small JSON round trip; it either answers quickly or
# it is not going to. Keeping it short leaves the fetch its full budget inside
# the same 30s function ceiling.
AUTH_TIMEOUT = 8

# One access token is reused until it is nearly expired. Minting one per upload
# would add a round-trip to Google on every submission for no benefit.
_token_cache = {"value": "", "expires_at": 0.0}

# Every call went through a fresh connection, so each proof view paid a new TLS
# handshake to googleapis.com on top of the download. A Session keeps the
# connection pool alive for the life of the process.
_session = requests.Session()

# Proof bytes, keyed by Drive file id. A treasurer works down a queue and comes
# back to records, and every one of those views was a full re-download. Drive
# ids are immutable here - replacing a screenshot uploads a NEW file and stores
# a new id (see participant_service) - so a cached body can never be stale.
_BYTE_CACHE_MAX_ENTRIES = 24
_BYTE_CACHE_MAX_BYTES = 24 * 1024 * 1024
_BYTE_CACHE_TTL = 900
_byte_cache: "OrderedDict[str, Tuple[float, bytes, str]]" = OrderedDict()


def _cache_get(file_id: str) -> Optional[Tuple[bytes, str]]:
    hit = _byte_cache.get(file_id)
    if not hit:
        return None
    stored_at, data, mime = hit
    if time.time() - stored_at > _BYTE_CACHE_TTL:
        _byte_cache.pop(file_id, None)
        return None
    _byte_cache.move_to_end(file_id)
    return data, mime


def _cache_put(file_id: str, data: bytes, mime: str) -> None:
    # A single oversized proof must not evict everything else to sit there
    # alone, so it simply is not cached.
    if len(data) > _BYTE_CACHE_MAX_BYTES // 2:
        return
    _byte_cache[file_id] = (time.time(), data, mime)
    _byte_cache.move_to_end(file_id)
    while len(_byte_cache) > _BYTE_CACHE_MAX_ENTRIES or sum(
        len(v[1]) for v in _byte_cache.values()
    ) > _BYTE_CACHE_MAX_BYTES:
        _byte_cache.popitem(last=False)


def is_configured() -> bool:
    return bool(FOLDER_ID and CLIENT_ID and CLIENT_SECRET and REFRESH_TOKEN)


def is_drive_ref(stored: str) -> bool:
    return (stored or "").startswith(PREFIX)


def file_id_of(stored: str) -> str:
    return (stored or "")[len(PREFIX):] if is_drive_ref(stored) else ""


# A Drive *share link* pasted into the column instead of a "gdrive:" ref. Not
# what this app writes, but the column is hand-editable and a link is the
# obvious thing to paste, and every one of those was previously handed to
# sign_file_url and reported to the treasurer as "may have been removed".
_DRIVE_URL_ID = re.compile(
    r"(?:drive|docs)\.google\.com/(?:.*?/d/|.*?[?&]id=)([A-Za-z0-9_-]{10,})"
)


def file_id_from_url(value: str) -> str:
    """The Drive file id inside a share/preview URL, or '' if it is not one."""
    m = _DRIVE_URL_ID.search(value or "")
    return m.group(1) if m else ""


def _access_token() -> str:
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] - 60 > now:
        return _token_cache["value"]

    r = _session.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": REFRESH_TOKEN,
            "grant_type": "refresh_token",
        },
        timeout=AUTH_TIMEOUT,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Drive auth failed: HTTP {r.status_code} {r.text[:200]}")

    body = r.json()
    _token_cache["value"] = body.get("access_token", "")
    _token_cache["expires_at"] = now + float(body.get("expires_in", 3600))
    if not _token_cache["value"]:
        raise RuntimeError("Drive auth returned no access_token")
    return _token_cache["value"]


def upload_bytes(data: bytes, mime: str, filename: str) -> str:
    """Put one image in the configured folder; returns 'gdrive:<fileId>'."""
    metadata = {"name": filename, "parents": [FOLDER_ID]}

    # multipart/related is the single-request upload: metadata part, then the
    # bytes. requests' files= would send multipart/form-data, which Drive
    # rejects, so the body is assembled by hand.
    boundary = "zin26" + hashlib.sha1(filename.encode()).hexdigest()[:16]
    body = b"".join([
        f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n".encode(),
        json.dumps(metadata).encode(),
        f"\r\n--{boundary}\r\nContent-Type: {mime}\r\n\r\n".encode(),
        data,
        f"\r\n--{boundary}--".encode(),
    ])

    r = _session.post(
        "https://www.googleapis.com/upload/drive/v3/files",
        params={"uploadType": "multipart", "fields": "id", "supportsAllDrives": "true"},
        headers={
            "Authorization": f"Bearer {_access_token()}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        data=body,
        # Same ceiling as the read side, and for the same reason: a timeout
        # longer than the platform's own can never fire, so the upload would be
        # killed by Vercel mid-write with nothing logged and the participant's
        # row already committed.
        timeout=FETCH_TIMEOUT,
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Drive upload failed: HTTP {r.status_code} {r.text[:200]}")

    file_id = r.json().get("id", "")
    if not file_id:
        raise RuntimeError("Drive upload returned no file id")
    return f"{PREFIX}{file_id}"


def fetch(file_id: str) -> Tuple[bytes, str]:
    """Download one file's bytes for the proxy endpoint."""
    cached = _cache_get(file_id)
    if cached:
        return cached

    r = _session.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        params={"alt": "media", "supportsAllDrives": "true"},
        headers={"Authorization": f"Bearer {_access_token()}"},
        timeout=FETCH_TIMEOUT,
    )
    if r.status_code != 200:
        raise RuntimeError(f"Drive fetch failed: HTTP {r.status_code} {r.text[:200]}")

    mime = r.headers.get("Content-Type", "image/jpeg")
    _cache_put(file_id, r.content, mime)
    return r.content, mime


def delete(file_id: str) -> bool:
    r = _session.delete(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        params={"supportsAllDrives": "true"},
        headers={"Authorization": f"Bearer {_access_token()}"},
        timeout=TIMEOUT,
    )
    return r.status_code in (200, 204)


# --- proxy tokens ------------------------------------------------------------

def _sign(body: str) -> str:
    # Fail closed. Every other AUTH_SECRET_KEY consumer raises at import; this
    # module is imported lazily from inside request handlers, so an entrypoint
    # that never loaded the environment would otherwise sign with "" - a key an
    # attacker knows, which turns the token into no authorisation at all.
    if not AUTH_SECRET_KEY:
        raise RuntimeError("AUTH_SECRET_KEY is not set - refusing to sign a proof token")
    return hmac.new(AUTH_SECRET_KEY.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]


# Expiries are rounded up to a boundary so that every token minted for the same
# file inside the same window is byte-identical. That matters more than it
# sounds: the token is in the query string, the browser caches on the whole URL,
# and a per-second expiry meant the URL changed on every single view - so the
# Cache-Control the proxy sets could never once hit and each view paid a fresh
# ~1.5s round trip to Drive. The grant is unchanged: still one file, still an
# absolute expiry, just quantised.
TOKEN_WINDOW = 60


def proxy_token(file_id: str, ttl: int = 300) -> str:
    expires_at = (int(time.time() + ttl) // TOKEN_WINDOW + 1) * TOKEN_WINDOW
    payload = {"f": file_id, "x": expires_at}
    body = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode().rstrip("=")
    return f"{body}.{_sign(body)}"


def open_proxy_token(token: str) -> Optional[str]:
    """Return the file id a token authorises, or None if forged or expired."""
    try:
        body, sig = (token or "").split(".", 1)
    except ValueError:
        return None
    if not hmac.compare_digest(sig, _sign(body)):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except Exception:
        return None
    if int(payload.get("x", 0)) < int(time.time()):
        return None
    return str(payload.get("f") or "") or None
