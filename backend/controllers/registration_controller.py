"""
Zinnia 2026 — Registration Controller
Handles team registration requests and event validation.
"""

from flask import request, jsonify
from services.registration_service import register_team_service

class RegistrationController:
    """Controller handling team registration."""

    @staticmethod
    def register():
        """
        POST /api/register
        Accepts: {
          team_name, college, department, year,
          selected_event_ids: ["EV-01", "EV-02"],
          members: [{ name, email, phone, is_leader }]
        }
        """
        data = request.get_json(silent=True) or {}
        if not data or not isinstance(data, dict):
            return jsonify({"success": False, "error_code": "INVALID_BODY", "message": "Invalid JSON body."}), 400

        result = register_team_service(data)
        status_code = 201 if result.get("success") else 400
        return jsonify(result), status_code
