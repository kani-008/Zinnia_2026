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
import time
from typing import Optional, Tuple

import requests

FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "").strip()
CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
REFRESH_TOKEN = os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", "").strip()

AUTH_SECRET_KEY = os.getenv("AUTH_SECRET_KEY") or ""

PREFIX = "gdrive:"
TIMEOUT = 30

# One access token is reused until it is nearly expired. Minting one per upload
# would add a round-trip to Google on every submission for no benefit.
_token_cache = {"value": "", "expires_at": 0.0}


def is_configured() -> bool:
    return bool(FOLDER_ID and CLIENT_ID and CLIENT_SECRET and REFRESH_TOKEN)


def is_drive_ref(stored: str) -> bool:
    return (stored or "").startswith(PREFIX)


def file_id_of(stored: str) -> str:
    return (stored or "")[len(PREFIX):] if is_drive_ref(stored) else ""


def _access_token() -> str:
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] - 60 > now:
        return _token_cache["value"]

    r = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": REFRESH_TOKEN,
            "grant_type": "refresh_token",
        },
        timeout=TIMEOUT,
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

    r = requests.post(
        "https://www.googleapis.com/upload/drive/v3/files",
        params={"uploadType": "multipart", "fields": "id", "supportsAllDrives": "true"},
        headers={
            "Authorization": f"Bearer {_access_token()}",
            "Content-Type": f"multipart/related; boundary={boundary}",
        },
        data=body,
        timeout=max(TIMEOUT, 60),
    )
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Drive upload failed: HTTP {r.status_code} {r.text[:200]}")

    file_id = r.json().get("id", "")
    if not file_id:
        raise RuntimeError("Drive upload returned no file id")
    return f"{PREFIX}{file_id}"


def fetch(file_id: str) -> Tuple[bytes, str]:
    """Download one file's bytes for the proxy endpoint."""
    r = requests.get(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        params={"alt": "media", "supportsAllDrives": "true"},
        headers={"Authorization": f"Bearer {_access_token()}"},
        timeout=max(TIMEOUT, 60),
    )
    if r.status_code != 200:
        raise RuntimeError(f"Drive fetch failed: HTTP {r.status_code} {r.text[:200]}")
    return r.content, r.headers.get("Content-Type", "image/jpeg")


def delete(file_id: str) -> bool:
    r = requests.delete(
        f"https://www.googleapis.com/drive/v3/files/{file_id}",
        params={"supportsAllDrives": "true"},
        headers={"Authorization": f"Bearer {_access_token()}"},
        timeout=TIMEOUT,
    )
    return r.status_code in (200, 204)


# --- proxy tokens ------------------------------------------------------------

def _sign(body: str) -> str:
    return hmac.new(AUTH_SECRET_KEY.encode(), body.encode(), hashlib.sha256).hexdigest()[:32]


def proxy_token(file_id: str, ttl: int = 300) -> str:
    payload = {"f": file_id, "x": int(time.time()) + ttl}
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
