"""
One-time Google Drive authorisation. Run once, never again.

    python scripts/gdrive_authorize.py

Prints a URL. Open it in the browser where you are signed in as the OWNER of the
target Drive folder, approve, and this script captures the redirect, exchanges
the code, and writes GOOGLE_OAUTH_REFRESH_TOKEN into .env.

Why a loopback server and not a pasted code: Google switched off the
out-of-band ("urn:ietf:wg:oauth:2.0:oob") flow in 2022, so a desktop client has
to receive the code on http://localhost. Installed-app clients may use any port,
which is why nothing needs registering beyond the plain "http://localhost" that
is already in the client JSON.

The refresh token is the credential — treat it like a password. It does not
expire on its own, but it dies if the Google account revokes app access or the
OAuth consent screen stays in "Testing" for more than seven days.
"""

import http.server
import os
import re
import socket
import sys
import threading
import urllib.parse
import webbrowser

import requests
from dotenv import load_dotenv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT, ".env")
load_dotenv(ENV_PATH, override=True)

CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()

# Full drive, deliberately: drive.file only reaches files this app created, so
# it cannot write into a folder that already exists and belongs to the user.
SCOPE = "https://www.googleapis.com/auth/drive"

_code_box = {}


class _Catcher(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        _code_box["code"] = (params.get("code") or [""])[0]
        _code_box["error"] = (params.get("error") or [""])[0]

        body = (
            b"<h2>Zinnia 2026 - Drive connected.</h2><p>You can close this tab.</p>"
            if _code_box["code"]
            else b"<h2>Authorisation failed.</h2><p>Check the terminal.</p>"
        )
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass  # the default handler prints a line per request to stderr


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _write_refresh_token(token: str) -> None:
    with open(ENV_PATH, "r", encoding="utf-8") as fh:
        text = fh.read()

    line = f"GOOGLE_OAUTH_REFRESH_TOKEN={token}"
    if re.search(r"^GOOGLE_OAUTH_REFRESH_TOKEN=.*$", text, flags=re.M):
        text = re.sub(r"^GOOGLE_OAUTH_REFRESH_TOKEN=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip("\n") + "\n" + line + "\n"

    with open(ENV_PATH, "w", encoding="utf-8") as fh:
        fh.write(text)


def main() -> int:
    if not CLIENT_ID or not CLIENT_SECRET:
        print("[!] GOOGLE_OAUTH_CLIENT_ID / _SECRET missing from .env")
        return 1

    port = _free_port()
    redirect_uri = f"http://localhost:{port}"

    server = http.server.HTTPServer(("127.0.0.1", port), _Catcher)
    threading.Thread(target=server.handle_request, daemon=True).start()

    auth_url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(
        {
            "client_id": CLIENT_ID,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": SCOPE,
            # offline + consent together are what guarantee a refresh_token comes
            # back. Without prompt=consent Google omits it on re-authorisation,
            # which is the classic "it worked once and never again" trap.
            "access_type": "offline",
            "prompt": "consent",
        }
    )

    print("\n" + "=" * 78)
    print("Open this URL, signed in as the Drive folder's owner:\n")
    print(auth_url)
    print("\nWaiting for the redirect (Ctrl+C to give up)...")
    print("=" * 78 + "\n")
    sys.stdout.flush()

    try:
        webbrowser.open(auth_url)
    except Exception:
        pass  # headless is fine, the URL is printed above

    while "code" not in _code_box and "error" not in _code_box:
        threading.Event().wait(0.4)

    if _code_box.get("error") or not _code_box.get("code"):
        print(f"[!] Authorisation refused: {_code_box.get('error') or 'no code returned'}")
        return 1

    resp = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": _code_box["code"],
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"[!] Token exchange failed: HTTP {resp.status_code} {resp.text[:400]}")
        return 1

    refresh = resp.json().get("refresh_token", "")
    if not refresh:
        print("[!] No refresh_token in the response. Revoke the app at "
              "https://myaccount.google.com/permissions and run this again.")
        return 1

    _write_refresh_token(refresh)
    print(f"[ok] Refresh token stored in .env (length {len(refresh)}).")
    print("[ok] Restart the backend to pick it up.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
