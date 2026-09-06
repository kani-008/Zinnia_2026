"""
Rate Limiting & Request Middlewares for Flask Backend.

SERVERLESS CAVEAT
    The counter below is an in-process dict. On a long-running server (gunicorn
    on a VM) that is a real limit. On Vercel each serverless invocation may be a
    fresh process, and concurrent invocations do not share memory — so the limit
    becomes "per warm instance" rather than global, and a determined attacker
    gets more attempts than the number suggests.

    It still blunts a naive script hammering one connection, which is most of
    what it is there for. Making it authoritative needs shared state (Upstash
    Redis or a Postgres counter keyed by IP); worth doing before the admin panel
    guards anything valuable, along with rotating the seeded passwords.
"""

import os
import time
from functools import wraps
from collections import defaultdict
from flask import request, jsonify

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

# Keyed by (client ip, endpoint) — NOT by ip alone.
#
# With one bucket per ip, every rate-limited route shared a single counter, so
# ten admin sign-ins used up the registration form's budget and a participant
# on the same address was told to wait. On a college network everyone shares one
# NAT address, which made the effective limit ten requests a minute for the
# entire campus across sign-in, registration and payment combined.
request_history = defaultdict(list)


def _client_ip() -> str:
    # X-Forwarded-For is a list when proxies chain; the client is the first entry.
    fwd = request.headers.get("X-Forwarded-For", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "127.0.0.1"


def rate_limit(limit: int = RATE_LIMIT_PER_MINUTE):
    """Rate-limit one endpoint per client IP, independently of other endpoints."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # request.endpoint is the registered route name, so two routes
            # bound to the same view still get their own bucket.
            key = (_client_ip(), request.endpoint or f.__name__)
            now = time.time()
            # Prune timestamps older than 60s
            request_history[key] = [t for t in request_history[key] if now - t < 60]
            if len(request_history[key]) >= limit:
                # Same {success, error_code, message} envelope as every other
                # endpoint: the frontend reads `message` and shows it verbatim,
                # so anything else surfaces as a generic "something went wrong".
                oldest = min(request_history[key])
                retry_after = max(1, int(60 - (now - oldest)))
                return jsonify({
                    "success": False,
                    "error_code": "RATE_LIMITED",
                    "message": f"Too many attempts. Please wait {retry_after} seconds and try again.",
                    "retry_after": retry_after,
                }), 429, {"Retry-After": str(retry_after)}
            request_history[key].append(now)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Legacy alias: the counter used to be exposed under this name.
ip_request_history = request_history
