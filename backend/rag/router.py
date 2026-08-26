"""
Question Router for Zinnia Symposium RAG Assistant.
Orchestrates FAQ matching, SQLite Cache, ChromaDB Vector Retrieval, and Multi-Provider LLM Generation.
"""

from typing import Dict, Any, List
from .greetings import check_greeting_intent
from .faq_matcher import get_faq_matcher
from .cache import get_cache_manager, normalize_text
from .retriever import get_retriever
from .llm import get_llm_manager
from .prompts import FALLBACK_NO_CONTEXT_ANSWER

class QuestionRouter:
    def __init__(self):
        self.faq_matcher = get_faq_matcher()
        self.cache_mgr = get_cache_manager()
        self.retriever = get_retriever()
        self.llm_mgr = get_llm_manager()

    def process_question(self, question: str) -> Dict[str, Any]:
        """
        Process a user question through the resilient RAG pipeline:
        1. Greetings & Conversational Small-talk Detection (Instant, zero-cost)
        2. Semantic FAQ Lookup (Zero-cost, instant pre-written verified answers)
        3. SQLite Cache Lookup (Zero-cost, instant cache hits)
        4. ChromaDB Semantic Retrieval (Locally embedded vectors)
        5. LLM Generation with multi-provider fallback (Groq / Gemini / OpenAI / Context Synthesizer)
        6. Store in Cache for future users
        """
        if not question or not question.strip():
            return {
                "answer": "Hey y'all! Please ask any question about Zinnia 2026 symposium events, registration, rules, prizes, or schedule!",
                "source": "fallback",
                "cached": False,
                "confidence": 0.0,
                "sources": []
            }

        clean_question = question.strip()

        # -------------------------------------------------------------
        # STEP 0: Conversational & Greeting Intent Handler
        # -------------------------------------------------------------
        greeting_res = check_greeting_intent(clean_question)
        if greeting_res:
            print(f"[Router] Greeting/Conversational Intent matched for '{clean_question}' ({greeting_res.get('type')})")
            return {
                "answer": greeting_res["answer"],
                "source": "greeting",
                "cached": True,
                "confidence": greeting_res.get("confidence", 1.0),
                "sources": [{"title": "Miss Minutes AI Core", "type": "mascot"}]
            }

        # -------------------------------------------------------------
        # STEP 1: Semantic & Exact FAQ Pre-Written Answers
        # -------------------------------------------------------------
        faq_match = self.faq_matcher.find_match(clean_question, threshold=0.75)

        if faq_match:
            print(f"[Router] FAQ Match found for '{clean_question}' -> Matched '{faq_match.get('matched_question')}' (Confidence: {faq_match.get('confidence')})")
            return {
                "answer": faq_match["answer"],
                "source": "faq",
                "cached": True,
                "confidence": faq_match["confidence"],
                "matched_question": faq_match.get("matched_question"),
                "sources": [{"title": f"Official FAQ - {faq_match.get('category', 'General')}", "type": "faq"}]
            }

        # -------------------------------------------------------------
        # STEP 2: SQLite Answer Cache Lookup
        # -------------------------------------------------------------
        cached_result = self.cache_mgr.get(clean_question)
        if cached_result:
            print(f"[Router] Cache Hit for '{clean_question}' (Source: {cached_result.get('original_source')})")
            return {
                "answer": cached_result["answer"],
                "source": "cache",
                "original_source": cached_result.get("original_source", "llm"),
                "cached": True,
                "confidence": cached_result.get("confidence", 0.95),
                "hit_count": cached_result.get("hit_count", 1),
                "sources": [{"title": "Verified Answer Cache", "type": "cache"}]
            }

        # -------------------------------------------------------------
        # STEP 3: ChromaDB Vector Retrieval
        # -------------------------------------------------------------
        retrieved_chunks = self.retriever.query(clean_question, top_k=4)
        print(f"[Router] ChromaDB retrieved {len(retrieved_chunks)} relevant chunks for '{clean_question}'")

        # Determine relevance
        max_similarity = max([c.get("similarity", 0) for c in retrieved_chunks]) if retrieved_chunks else 0.0

        # If similarity is exceptionally low and no context found
        if max_similarity < 0.15:
            print(f"[Router] Low similarity ({max_similarity:.2f}) -> Returning safe fallback.")
            return {
                "answer": FALLBACK_NO_CONTEXT_ANSWER,
                "source": "fallback",
                "cached": False,
                "confidence": max_similarity,
                "sources": []
            }

        # -------------------------------------------------------------
        # STEP 4: LLM Generation / Safe Synthesis
        # -------------------------------------------------------------
        llm_response = self.llm_mgr.generate_answer(retrieved_chunks, clean_question)
        answer = llm_response["answer"]
        source = llm_response["source"]

        # Extract citation sources from metadata
        sources = []
        for chunk in retrieved_chunks:
            meta = chunk.get("metadata", {})
            src_name = meta.get("source", "Symposium Knowledge Base")
            sec_name = meta.get("section") or meta.get("event_name") or meta.get("category") or "General"
            title = f"{src_name}: {sec_name}"
            if title not in [s["title"] for s in sources]:
                sources.append({"title": title, "type": meta.get("doc_type", "document")})

        # -------------------------------------------------------------
        # STEP 5: Cache generated answer for future users
        # -------------------------------------------------------------
        if answer != FALLBACK_NO_CONTEXT_ANSWER and len(answer) > 20:
            self.cache_mgr.set(
                query=clean_question,
                answer=answer,
                source=source,
                confidence=round(max_similarity, 4)
            )

        return {
            "answer": answer,
            "source": source,
            "provider": llm_response.get("provider"),
            "cached": False,
            "confidence": round(max_similarity, 4),
            "sources": sources
        }

# Global router instance
_router_instance = None

def get_router() -> QuestionRouter:
    global _router_instance
    if _router_instance is None:
        _router_instance = QuestionRouter()
    return _router_instance
