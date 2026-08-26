"""
Zinnia 2026 — Chat & RAG Assistant Controller
Handles request parsing, input validation, and responses for AI Assistant & Ingestion.
"""

import os
import json
from flask import request, jsonify

from rag.ingest import run_ingestion
from rag.retriever import get_retriever
from rag.router import get_router
from rag.cache import get_cache_manager

class ChatController:
    """Controller handling AI Assistant chat, FAQs, and health endpoints."""

    @staticmethod
    def health_check():
        """GET /api/health — System health and index telemetry."""
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

    @staticmethod
    def get_faqs():
        """GET /api/faq — Curated Suggested FAQs."""
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        faq_path = os.path.join(backend_dir, "knowledge", "faq.json")
        if os.path.exists(faq_path):
            with open(faq_path, "r", encoding="utf-8") as f:
                faqs = json.load(f)
            suggested = [
                {"id": f["id"], "question": f["question"], "category": f.get("category", "General")}
                for f in faqs
            ]
            return jsonify({"faqs": suggested})
        return jsonify({"faqs": []})

    @staticmethod
    def chat():
        """POST /api/chat — Process natural language query through RAG pipeline."""
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

        try:
            router = get_router()
            result = router.process_question(question)
            return jsonify(result)
        except Exception as e:
            return jsonify({
                "answer": "An unexpected error occurred while processing your request. Please contact the symposium organizers directly.",
                "source": "fallback",
                "cached": False,
                "error": str(e)
            }), 500

    @staticmethod
    def trigger_ingest():
        """POST /api/ingest — Force re-indexing of symposium knowledge files."""
        try:
            force = request.args.get("force", "true").lower() == "true"
            res = run_ingestion(force=force)
            return jsonify(res)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 500
