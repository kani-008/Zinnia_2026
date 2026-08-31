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

        try:
            result = register_team_service(data)
            return jsonify(result), 200
        except Exception as e:
            print(f"[Registration Error] Exception during registration endpoint: {e}")
            return jsonify({
                "success": False,
                "error_code": "REGISTRATION_ERROR",
                "message": f"Server encountered an error processing registration: {str(e)}"
            }), 200
