"""
Vercel serverless entrypoint for the Flask API.

The whole project deploys to Vercel, so the backend runs here as a Python
serverless function rather than on a separate host. Vercel's Python runtime
looks for a module-level WSGI callable named `app`; `backend/app.py` already
builds one, so this file only has to make `backend/` importable and re-export
it.

Routing: vercel.json rewrites /api/(.*) to this function, and the original
request path is what reaches Flask — so the blueprints keep their existing
/api/... rules and nothing in the app needs to know it is on Vercel.

Configuration is entirely environment variables, set in
Vercel -> Project -> Settings -> Environment Variables. See .env.example for
the full list; the ones without which the app will not boot are
AUTH_SECRET_KEY, QR_SIGNING_SECRET, SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY.
"""

import os
import sys

# backend/ sits beside this file's parent, and its modules import each other as
# top-level names (`from services...`, `from routes...`), so the directory
# itself has to be on the path — importing `backend.app` would break those.
BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

def _diagnostic_app(detail: str):
    """
    Stand-in WSGI app used when the real one cannot be imported.

    Several modules raise at import when a required variable is missing —
    auth_middleware on AUTH_SECRET_KEY, passport_service on QR_SIGNING_SECRET.
    On Vercel that kills the whole function, and every route, including ones
    that do not exist, answers FUNCTION_INVOCATION_FAILED with no clue why.
    Returning the reason turns a half-hour of guesswork into one line.
    """
    import json

    def _app(environ, start_response):
        body = json.dumps({
            "success": False,
            "error_code": "STARTUP_FAILED",
            "message": (
                "The API could not start. This is almost always a missing "
                "environment variable in the deployment: AUTH_SECRET_KEY, "
                "QR_SIGNING_SECRET, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
                "are all required, and the project must be redeployed after "
                "adding them."
            ),
            "detail": detail,
        }).encode()
        start_response("503 Service Unavailable", [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(body))),
        ])
        return [body]

    return _app


try:
    from app import app  # noqa: E402  (path setup must run first)
except Exception as exc:  # noqa: BLE001 — the reason is the whole point
    print(f"[api/index] startup failed: {type(exc).__name__}: {exc}")
    app = _diagnostic_app(f"{type(exc).__name__}: {exc}")

# Vercel invokes this name.
application = app

__all__ = ["app", "application"]
