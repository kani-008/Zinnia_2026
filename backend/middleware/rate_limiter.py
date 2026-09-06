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
ip_request_history = defaultdict(list)

def rate_limit(limit: int = RATE_LIMIT_PER_MINUTE):
    """Decorator to rate-limit endpoints per client IP."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
            now = time.time()
            # Prune timestamps older than 60s
            ip_request_history[client_ip] = [t for t in ip_request_history[client_ip] if now - t < 60]
            if len(ip_request_history[client_ip]) >= limit:
                # Same {success, error_code, message} envelope as every other
                # endpoint: the frontend reads `message` and shows it verbatim,
                # so anything else surfaces as a generic "something went wrong".
                oldest = min(ip_request_history[client_ip])
                retry_after = max(1, int(60 - (now - oldest)))
                return jsonify({
                    "success": False,
                    "error_code": "RATE_LIMITED",
                    "message": f"Too many attempts. Please wait {retry_after} seconds and try again.",
                    "retry_after": retry_after,
                }), 429, {"Retry-After": str(retry_after)}
            ip_request_history[client_ip].append(now)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
