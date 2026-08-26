"""
Zinnia 2026 — AI Assistant & RAG Routes
Defines endpoints and maps them to ChatController actions with middleware.
"""

from flask import Blueprint
from controllers.chat_controller import ChatController
from middleware.rate_limiter import rate_limit

chat_bp = Blueprint("chat_bp", __name__)

# Health and FAQ routes
chat_bp.route("/api/health", methods=["GET"])(ChatController.health_check)
chat_bp.route("/api/faq", methods=["GET"])(ChatController.get_faqs)

# Rate-limited Natural Language Chat
chat_bp.route("/api/chat", methods=["POST"])(rate_limit()(ChatController.chat))

# Admin Ingest Trigger
chat_bp.route("/api/ingest", methods=["POST"])(ChatController.trigger_ingest)
