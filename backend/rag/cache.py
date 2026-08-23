"""
SQLite caching layer for symposium AI queries and generated answers.
Prevents redundant LLM API calls and speeds up response times for frequently asked questions.
"""

import os
import sqlite3
import re
from typing import Optional, Dict, Any
from datetime import datetime, timezone

CACHE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cache.db")

def normalize_text(text: str) -> str:
    """Normalize text for consistent cache lookup."""
    if not text:
        return ""
    # Lowercase, remove excess whitespace and punctuation
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

class CacheManager:
    def __init__(self, db_path: str = CACHE_DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Create cache tables if they don't exist."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS qa_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    normalized_query TEXT UNIQUE NOT NULL,
                    original_query TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    source TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    hit_count INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_normalized_query ON qa_cache(normalized_query)")
            conn.commit()

    def get(self, query: str) -> Optional[Dict[str, Any]]:
        """Look up answer in cache by normalized query."""
        norm = normalize_text(query)
        if not norm:
            return None

        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT answer, source, confidence, hit_count FROM qa_cache WHERE normalized_query = ?",
                    (norm,)
                )
                row = cursor.fetchone()
                if row:
                    # Update hit count and last accessed time
                    cursor.execute(
                        "UPDATE qa_cache SET hit_count = hit_count + 1, last_accessed_at = ? WHERE normalized_query = ?",
                        (datetime.now(timezone.utc).isoformat(), norm)
                    )
                    conn.commit()
                    return {
                        "answer": row["answer"],
                        "source": "cache",
                        "original_source": row["source"],
                        "confidence": row["confidence"],
                        "hit_count": row["hit_count"] + 1,
                        "cached": True
                    }
        except Exception as e:
            print(f"[Cache Error] Read failed: {e}")
        return None

    def set(self, query: str, answer: str, source: str = "llm", confidence: float = 1.0) -> bool:
        """Store generated answer in cache."""
        norm = normalize_text(query)
        if not norm or not answer or not answer.strip():
            return False

        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now(timezone.utc).isoformat()
                cursor.execute("""
                    INSERT INTO qa_cache (normalized_query, original_query, answer, source, confidence, hit_count, created_at, last_accessed_at)
                    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
                    ON CONFLICT(normalized_query) DO UPDATE SET
                        answer = excluded.answer,
                        source = excluded.source,
                        confidence = excluded.confidence,
                        last_accessed_at = excluded.last_accessed_at
                """, (norm, query.strip(), answer.strip(), source, confidence, now, now))
                conn.commit()
                return True
        except Exception as e:
            print(f"[Cache Error] Write failed: {e}")
            return False

    def clear(self):
        """Clear all cached answers."""
        try:
            with self._get_connection() as conn:
                conn.execute("DELETE FROM qa_cache")
                conn.commit()
        except Exception as e:
            print(f"[Cache Error] Clear failed: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Return cache statistics."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as total_entries, SUM(hit_count) as total_hits FROM qa_cache")
                row = cursor.fetchone()
                return {
                    "total_entries": row["total_entries"] or 0,
                    "total_hits": row["total_hits"] or 0
                }
        except Exception:
            return {"total_entries": 0, "total_hits": 0}

# Global instance
_cache_instance = None

def get_cache_manager() -> CacheManager:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheManager()
    return _cache_instance
