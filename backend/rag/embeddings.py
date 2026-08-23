"""
Embeddings manager using sentence-transformers.
Provides local, zero-cost vector embedding generation for queries and documents.
"""

import os
import numpy as np
from typing import List, Union

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

class EmbeddingManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingManager, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[Embeddings] Initializing local SentenceTransformer: {MODEL_NAME}...", flush=True)
            self._model = SentenceTransformer(MODEL_NAME)
            print("[Embeddings] Model successfully loaded.", flush=True)
        except Exception as e:
            print(f"[Embeddings Warning] Failed to load SentenceTransformer: {e}", flush=True)
            self._model = None

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding vector for a single query."""
        if not query or not query.strip():
            return [0.0] * 384
            
        if self._model:
            emb = self._model.encode(query.strip(), convert_to_numpy=True, normalize_embeddings=True)
            return emb.tolist()
        else:
            # Fallback simple deterministic hash vector if torch unavailable
            return self._hash_embed(query)

    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of document strings."""
        if not documents:
            return []
            
        if self._model:
            embs = self._model.encode(documents, convert_to_numpy=True, normalize_embeddings=True)
            return embs.tolist()
        else:
            return [self._hash_embed(doc) for doc in documents]

    def _hash_embed(self, text: str, dim: int = 384) -> List[float]:
        """Lightweight fallback embedding generator."""
        import hashlib
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for i, w in enumerate(words):
            h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
            idx = h % dim
            vec[idx] += 1.0 / (1.0 + i * 0.1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Calculate cosine similarity between two unit vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

# Global accessor
def get_embedding_manager() -> EmbeddingManager:
    return EmbeddingManager()
