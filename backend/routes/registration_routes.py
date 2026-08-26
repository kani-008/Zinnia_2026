"""
Zinnia 2026 — Registration Routes
Defines endpoint for server-side team and event enrollment.
"""

from flask import Blueprint
from controllers.registration_controller import RegistrationController

registration_bp = Blueprint("registration_bp", __name__)

registration_bp.route("/api/register", methods=["POST"])(RegistrationController.register)
