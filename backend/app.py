"""
Production Flask Application Entry Point for Zinnia 2026.
Configures CORS, registers middleware, attaches modular route blueprints, and launches server.
"""

import os
import sys
from dotenv import load_dotenv

# Ensure backend root is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Disable SSL verification warnings & patch requests globally to bypass local SSL chain errors
import ssl
import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

_orig_request = requests.Session.request
def _patched_request(self, method, url, **kwargs):
    kwargs.setdefault('verify', False)
    return _orig_request(self, method, url, **kwargs)
requests.Session.request = _patched_request

# Load server environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask
from flask_cors import CORS

from routes.passport_routes import passport_bp
from routes.registration_routes import registration_bp
from routes.payment_routes import payment_bp
from middleware.error_handler import register_error_handlers

def check_db_connection():
    """Verify database connection status and table permissions on server startup."""
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
    
    if not supabase_url or "your_project" in supabase_url.lower() or "your-project" in supabase_url.lower():
        print("[DB Error] Database connection failed: Placeholder SUPABASE_URL configured in .env")
        return

    if not supabase_key or "your_supabase" in supabase_key.lower():
        print("[DB Error] Database connection failed: Placeholder SUPABASE_ANON_KEY configured in .env")
        return

    try:
        import requests
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        r = requests.get(f"{supabase_url}/rest/v1/teams?select=count", headers=headers, timeout=5)
        if r.status_code == 200:
            print(f"[DB] Database connected successfully! ({supabase_url})")
        elif r.status_code == 401:
            print(f"[DB Error] Database connection failed: RLS Policy / Unauthorized. Please click 'Disable RLS' on tables in your Supabase Dashboard.")
        else:
            print(f"[DB Error] Database connection failed: HTTP {r.status_code} ({r.text[:150]})")
    except Exception as e:
        print(f"[DB Error] Database connection failed: {type(e).__name__} - {str(e)}")

def create_app() -> Flask:
    """Application Factory creating and configuring the Flask app instance."""
    app = Flask(__name__)
    
    # 1. Enable CORS for frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # 2. Register Global Middlewares
    register_error_handlers(app)

    # 3. Register Modular Route Blueprints
    app.register_blueprint(passport_bp)
    app.register_blueprint(registration_bp)
    app.register_blueprint(payment_bp)

    # 4. Check DB Connection
    check_db_connection()

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "False").lower() == "true"
    print(f"[*] Starting Zinnia 2026 Server on http://localhost:{port}")
    app.run(host=host, port=port, debug=debug)
