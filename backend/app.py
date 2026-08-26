"""
Production Flask Application Entry Point for Zinnia 2026.
Configures CORS, registers middleware, attaches modular route blueprints, and launches server.
"""

import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load server environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask
from flask_cors import CORS

from routes.chat_routes import chat_bp
from routes.passport_routes import passport_bp
from routes.registration_routes import registration_bp
from routes.payment_routes import payment_bp
from middleware.error_handler import register_error_handlers
from rag.ingest import run_ingestion
from rag.retriever import get_retriever

def create_app() -> Flask:
    """Application Factory creating and configuring the Flask app instance."""
    app = Flask(__name__)
    
    # 1. Enable CORS for frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 2. Register Global Middlewares
    register_error_handlers(app)

    # 3. Register Modular Route Blueprints
    app.register_blueprint(chat_bp)
    app.register_blueprint(passport_bp)
    app.register_blueprint(registration_bp)
    app.register_blueprint(payment_bp)

    # 4. Initial RAG Ingestion Check
    with app.app_context():
        try:
            retriever = get_retriever()
            if retriever.count() == 0:
                print("[Backend Init] ChromaDB collection is empty. Performing initial ingestion...")
                run_ingestion()
        except Exception as e:
            print(f"[Backend Init Warning] Ingestion check notice: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "False").lower() == "true"
    print(f"[*] Starting Zinnia 2026 Server on http://localhost:{port}")
    app.run(host=host, port=port, debug=debug)
