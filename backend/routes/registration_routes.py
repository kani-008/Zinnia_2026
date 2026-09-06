"""
Zinnia 2026 — Registration Routes (DEPRECATED)

The one-shot team registration this endpoint served was retired at the Phase 6
cutover. Registration is now two stages (doc §4.1-§4.3):

    POST /api/participant/register          personal details -> UserID
    POST /api/participant/payment/submit    UTR -> pass emailed
    POST /api/participant/events/register   individual events
    POST /api/participant/teams/create      team events

The route is kept and answers 410 Gone rather than being deleted, so a stale
frontend, a cached bundle or a bookmarked POST gets a clear explanation instead
of a 404 that looks like an outage. Delete it once no 410s have been logged for
a full registration cycle.

RegistrationController and register_team_service are intentionally left in the
tree: the admin panel and the treasurer verification flow still read the legacy
tables those modules write, and they cannot be removed until the check-in
migration (§4.6) lands. See supabase/migrations/010_drop_legacy_tables.sql.
"""

from flask import Blueprint, jsonify

from middleware.rate_limiter import rate_limit

registration_bp = Blueprint("registration_bp", __name__)


@registration_bp.route("/api/register", methods=["POST"])
@rate_limit(10)
def register_deprecated():
    """410 Gone, naming the endpoint that replaced this one."""
    print("[Backend API] POST /api/register -> HTTP 410 | ENDPOINT_RETIRED")
    return (
        jsonify(
            {
                "success": False,
                "error_code": "ENDPOINT_RETIRED",
                "message": (
                    "One-shot team registration has been replaced. Register yourself first, "
                    "then add events from your dashboard."
                ),
                "replaced_by": {
                    "register": "/api/participant/register",
                    "payment": "/api/participant/payment/submit",
                    "individual_event": "/api/participant/events/register",
                    "team_event": "/api/participant/teams/create",
                },
            }
        ),
        410,
    )
