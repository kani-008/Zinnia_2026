"""
One resolver for zin26.payments.screenshot_url.

Three places read that column - the treasurer's panel, the participant's own
payment page and the legacy participant-model endpoint - and each had opened up
its own version of "what is this string?". They drifted, and the drift was not
harmless: every reference the branching did not recognise fell through to
zin26_db.sign_file_url, which returns a bare None for a value with no "/" in
it, and the treasurer was told the screenshot "may have been removed" for a
file that was sitting in Drive the whole time.

So the branching lives here, once, and it never guesses. Each failure carries
its own error_code and says what actually went wrong:

    NO_SCREENSHOT             nothing has been uploaded
    PROOF_BACKEND_UNAVAILABLE a Drive reference on a deployment with no Drive
                              credentials - a configuration problem, not a
                              missing file
    SIGN_FAILED               Supabase Storage would not sign the object

Accepted forms, in the order they are tried:

    gdrive:<fileId>       what this app writes today
    a Drive share URL     hand-pasted into the column
    any other http(s) URL passed straight through
    bucket/key            a Supabase Storage object path (the pre-Drive format,
                          and still the fallback when a Drive upload fails)
"""

from typing import Any, Dict

from services import zin26_db as db

PROOF_TTL_SECONDS = 600


def _drive_url(file_id: str, ttl: int) -> Dict[str, Any]:
    from services import drive_storage as drive

    # A reference the panel cannot serve is a deployment that never got the
    # GOOGLE_OAUTH_* variables. Saying so beats handing the browser a URL that
    # answers 502 into an <img> and shows an empty box with no explanation.
    if not drive.is_configured():
        return {
            "success": False,
            "error_code": "PROOF_BACKEND_UNAVAILABLE",
            "message": "The proof store is not configured on this server - the "
                       "image cannot be shown here. Check the Drive credentials.",
        }

    return {
        "success": True,
        # Relative on purpose: same-origin in local dev and on Vercel alike,
        # without the server having to know its own public host.
        "url": f"/api/admin/payment-proof?t={drive.proxy_token(file_id, ttl=ttl)}",
        "expires_in": ttl,
        "backend": "drive",
        "file_id": file_id,
        # The file in Drive itself, for a treasurer who would rather open it
        # there - and a way through if the proxy is having a bad day.
        "external_url": f"https://drive.google.com/file/d/{file_id}/view",
    }


def resolve(stored: str, *, ttl: int = PROOF_TTL_SECONDS) -> Dict[str, Any]:
    """Turn a stored reference into something an <img> can load."""
    stored = (stored or "").strip()
    if not stored:
        return {"success": False, "error_code": "NO_SCREENSHOT",
                "message": "No payment screenshot was submitted."}

    from services import drive_storage as drive

    if drive.is_drive_ref(stored):
        return _drive_url(drive.file_id_of(stored), ttl)

    if stored.startswith("http://") or stored.startswith("https://"):
        # A Drive link still goes through the proxy rather than being handed to
        # the browser: drive.google.com answers a bare view link with an
        # interstitial or a rate limit often enough to matter, and the folder
        # does not have to be public for the proxy to work.
        file_id = drive.file_id_from_url(stored)
        if file_id:
            return _drive_url(file_id, ttl)
        return {"success": True, "url": stored, "expires_in": 0, "backend": "url",
                "external_url": stored}

    signed = db.sign_file_url(stored, expires_in=ttl)
    if not signed:
        return {
            "success": False,
            "error_code": "SIGN_FAILED",
            # Deliberately not "it may have been removed": storage refusing to
            # sign is far more often a rotated key or a rate limit, and sending
            # a treasurer looking for a deleted file wastes their time.
            "message": "The screenshot could not be opened from storage. "
                       "Ask the participant to upload it again if it does not "
                       "come back.",
        }
    return {"success": True, "url": signed, "expires_in": ttl, "backend": "supabase"}
