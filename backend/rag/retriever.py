"""
ChromaDB vector database retriever for symposium documents and events.
Provides fast semantic chunk retrieval with metadata filtering.
"""

import os
from typing import List, Dict, Any, Optional
import chromadb
from .embeddings import get_embedding_manager

CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
COLLECTION_NAME = "zinnia_symposium_knowledge"

class ChromaRetriever:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaRetriever, cls).__new__(cls)
            cls._instance._init_chroma()
        return cls._instance

    def _init_chroma(self):
        os.makedirs(CHROMA_PATH, exist_ok=True)
        self.embedding_mgr = get_embedding_manager()
        self.client = chromadb.PersistentClient(path=CHROMA_PATH)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"[ChromaRetriever] Connected to collection '{COLLECTION_NAME}' (Total items: {self.collection.count()})")

    def count(self) -> int:
        """Return total number of vectorized chunks."""
        try:
            return self.collection.count()
        except Exception:
            return 0

    def query(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Query ChromaDB for the top-k most relevant knowledge chunks.
        """
        if not query_text or not query_text.strip():
            return []

        if self.collection.count() == 0:
            print("[ChromaRetriever Warning] Collection is empty. Ingestion required.")
            return []

        try:
            query_emb = self.embedding_mgr.embed_query(query_text)
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=min(top_k, self.collection.count()),
                include=["documents", "metadatas", "distances"]
            )

            retrieved = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                distances = results["distances"][0] if results.get("distances") else [1.0] * len(docs)

                for doc, meta, dist in zip(docs, metas, distances):
                    # In cosine distance: similarity = 1 - distance
                    sim = max(0.0, 1.0 - dist)
                    retrieved.append({
                        "text": doc,
                        "metadata": meta,
                        "similarity": round(sim, 4),
                        "distance": round(dist, 4)
                    })

            return retrieved
        except Exception as e:
            print(f"[ChromaRetriever Error] Query failed: {e}")
            return []

# Global accessor
def get_retriever() -> ChromaRetriever:
    return ChromaRetriever()
