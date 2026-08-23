"""
FAQ Matcher using semantic embeddings and normalized question similarity.
Returns pre-written official answers instantly without calling any LLM API.
"""

import os
import json
from typing import Optional, Dict, Any, List
from .embeddings import get_embedding_manager
from .cache import normalize_text

FAQ_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge", "faq.json")

class FAQMatcher:
    def __init__(self, faq_file: str = FAQ_JSON_PATH):
        self.faq_file = faq_file
        self.faqs = []
        self.faq_questions = []
        self.faq_embeddings = []
        self.embedding_mgr = get_embedding_manager()
        self._load_faqs()

    def _load_faqs(self):
        """Load FAQ questions and compute their embeddings for semantic lookup."""
        if not os.path.exists(self.faq_file):
            print(f"[FAQ Matcher Warning] FAQ file not found: {self.faq_file}")
            return

        try:
            with open(self.faq_file, "r", encoding="utf-8") as f:
                self.faqs = json.load(f)

            all_prompts = []
            self.faq_mapping = []

            for faq in self.faqs:
                # Add primary question
                q = faq.get("question", "")
                if q:
                    all_prompts.append(q)
                    self.faq_mapping.append(faq)

                # Add variations for richer semantic surface
                for var in faq.get("variations", []):
                    if var:
                        all_prompts.append(var)
                        self.faq_mapping.append(faq)

            self.faq_questions = all_prompts
            if all_prompts:
                print(f"[FAQ Matcher] Indexing {len(all_prompts)} FAQ questions and variations...")
                self.faq_embeddings = self.embedding_mgr.embed_documents(all_prompts)
                print(f"[FAQ Matcher] Indexing complete ({len(self.faq_embeddings)} vectors).")
        except Exception as e:
            print(f"[FAQ Matcher Error] Failed to initialize FAQs: {e}")

    def find_match(self, query: str, threshold: float = 0.80) -> Optional[Dict[str, Any]]:
        """
        Check if the user query matches an existing FAQ.
        Returns pre-written official answer if semantic similarity >= threshold.
        """
        if not query or not query.strip() or not self.faq_embeddings:
            return None

        norm_query = normalize_text(query)

        # 1. Exact / Normalized exact check first for instant speed
        for i, prompt in enumerate(self.faq_questions):
            if normalize_text(prompt) == norm_query:
                faq = self.faq_mapping[i]
                return {
                    "answer": faq["answer"],
                    "source": "faq",
                    "cached": True,
                    "confidence": 1.0,
                    "matched_question": faq["question"],
                    "category": faq.get("category", "General")
                }

        # 2. Semantic vector cosine similarity search
        query_emb = self.embedding_mgr.embed_query(query)
        best_score = -1.0
        best_idx = -1

        for i, emb in enumerate(self.faq_embeddings):
            sim = self.embedding_mgr.cosine_similarity(query_emb, emb)
            if sim > best_score:
                best_score = sim
                best_idx = i

        # If similarity meets threshold, return verified pre-written answer
        if best_score >= threshold and best_idx >= 0:
            faq = self.faq_mapping[best_idx]
            return {
                "answer": faq["answer"],
                "source": "faq",
                "cached": True,
                "confidence": round(best_score, 4),
                "matched_question": faq["question"],
                "category": faq.get("category", "General")
            }

        return None

# Global instance
_faq_matcher = None

def get_faq_matcher() -> FAQMatcher:
    global _faq_matcher
    if _faq_matcher is None:
        _faq_matcher = FAQMatcher()
    return _faq_matcher
