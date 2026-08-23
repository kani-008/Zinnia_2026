"""
Production-Ready Flask Backend for Zinnia Symposium AI Assistant.
Exposes /api/chat with rate-limiting, FAQ matching, SQLite caching, ChromaDB RAG, and LLM fallback.
"""

import os
import sys
import time
import json
from collections import defaultdict

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load server-side environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

print("[Flask Init] Starting Zinnia RAG Assistant application...", flush=True)

from rag.ingest import run_ingestion
from rag.retriever import get_retriever
from rag.router import get_router
from rag.cache import get_cache_manager

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

# -------------------------------------------------------------
# In-Memory Rate Limiter (Prevent Abuse)
# -------------------------------------------------------------
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
ip_request_history = defaultdict(list)

def is_rate_limited(client_ip: str) -> bool:
    """Check if client exceeded allowed requests in the last 60 seconds."""
    now = time.time()
    # Prune timestamps older than 60s
    ip_request_history[client_ip] = [t for t in ip_request_history[client_ip] if now - t < 60]
    if len(ip_request_history[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        return True
    ip_request_history[client_ip].append(now)
    return False

print("[Flask Init] Preloading RAG components...", flush=True)
router = get_router()
print("[Flask Init] Router and embeddings ready.", flush=True)

# -------------------------------------------------------------
# Auto-Ingest Verification on App Start
# -------------------------------------------------------------
with app.app_context():
    try:
        retriever = get_retriever()
        if retriever.count() == 0:
            print("[Backend Init] ChromaDB collection is empty. Performing initial ingestion...")
            run_ingestion()
    except Exception as e:
        print(f"[Backend Init Warning] Ingestion check notice: {e}")

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint showing RAG system status."""
    retriever = get_retriever()
    cache_mgr = get_cache_manager()
    stats = cache_mgr.get_stats()
    
    return jsonify({
        "status": "online",
        "symposium": "ZINNIA 2026",
        "knowledge_chunks_indexed": retriever.count(),
        "cache": stats,
        "primary_llm_provider": os.getenv("LLM_PROVIDER", "groq"),
        "secondary_llm_provider": os.getenv("SECONDARY_LLM_PROVIDER", "gemini"),
        "embedding_model": os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    })

@app.route("/api/faq", methods=["GET"])
def get_faqs():
    """Returns curated suggested FAQs for frontend quick-action pills."""
    faq_path = os.path.join(os.path.dirname(__file__), "knowledge", "faq.json")
    if os.path.exists(faq_path):
        with open(faq_path, "r", encoding="utf-8") as f:
            faqs = json.load(f)
        # Return compact list of suggested questions
        suggested = [
            {"id": f["id"], "question": f["question"], "category": f.get("category", "General")}
            for f in faqs
        ]
        return jsonify({"faqs": suggested})
    return jsonify({"faqs": []})

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Main Chat API Endpoint
    Accepts: { "question": "What is the registration fee?" }
    Returns: { "answer": "...", "source": "faq"|"cache"|"rag"|"llm"|"fallback", "cached": bool }
    """
    # 1. Rate Limiting Check
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
    if is_rate_limited(client_ip):
        return jsonify({
            "error": "Rate limit exceeded. Please wait a moment before sending more queries.",
            "answer": "Too many requests. Please wait a few moments before asking another question.",
            "source": "fallback",
            "cached": False
        }), 429

    # 2. Input Validation
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body. Expected {'question': '...'}"}), 400

    question = data.get("question", "").strip()
    if not question:
        return jsonify({
            "answer": "Please ask a question about Zinnia 2026 symposium events, registration, rules, or schedule.",
            "source": "fallback",
            "cached": False
        }), 400

    # 3. Process via Resilient RAG Router
    try:
        router = get_router()
        result = router.process_question(question)
        return jsonify(result)
    except Exception as e:
        print(f"[Chat Endpoint Error] {e}")
        return jsonify({
            "answer": "An unexpected error occurred while processing your request. Please contact the symposium organizers directly.",
            "source": "fallback",
            "cached": False,
            "error": str(e)
        }), 500

@app.route("/api/ingest", methods=["POST"])
def trigger_ingest():
    """Admin endpoint to re-index documents into ChromaDB."""
    try:
        force = request.args.get("force", "true").lower() == "true"
        res = run_ingestion(force=force)
        return jsonify(res)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "False").lower() == "true"
    print(f"[*] Starting Zinnia RAG Assistant Server on http://localhost:{port}")
    app.run(host=host, port=port, debug=debug)
