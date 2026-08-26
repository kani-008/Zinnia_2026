"""
Modular LLM Provider Interface with resilient multi-provider fallback.
Supports Groq, Gemini, OpenAI, OpenRouter, and local context synthesis fallback.
"""

import os
import json
import requests
import re
from typing import Dict, Any, Optional, List
from .prompts import SYSTEM_RAG_PROMPT, USER_QUESTION_PROMPT, FALLBACK_NO_CONTEXT_ANSWER

DEFAULT_PRIMARY_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
DEFAULT_SECONDARY_PROVIDER = os.getenv("SECONDARY_LLM_PROVIDER", "gemini").lower()
REQUEST_TIMEOUT_SECONDS = int(os.getenv("LLM_TIMEOUT", "10"))

class BaseLLMProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        raise NotImplementedError

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "groq/compound-mini"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", model)
        self.url = "https://api.groq.com/openai/v1/chat/completions"

    def generate(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.api_key:
            return None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 800
        }
        resp = requests.post(self.url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            content = data["choices"][0]["message"].get("content") or ""
            # Strip reasoning tags if present
            cleaned = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
            return cleaned if cleaned else content.strip()
        else:
            raise RuntimeError(f"Groq API error (status {resp.status_code}): {resp.text}")


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-1.5-flash"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", model)

    def generate(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600}
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
            return None
        else:
            raise RuntimeError(f"Gemini API error (status {resp.status_code}): {resp.text}")

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", model)
        self.url = "https://api.openai.com/v1/chat/completions"

    def generate(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        if not self.api_key:
            return None
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 600
        }
        resp = requests.post(self.url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        else:
            raise RuntimeError(f"OpenAI API error (status {resp.status_code}): {resp.text}")

class ContextSynthesizerFallback:
    """
    Zero-dependency local synthesizer. Extracts factual answers directly from
    retrieved RAG context chunks without hallucinations if external LLM APIs are offline or unconfigured.
    """
    def generate_from_context(self, context_chunks: List[Dict[str, Any]], question: str) -> str:
        if not context_chunks:
            return FALLBACK_NO_CONTEXT_ANSWER

        # Filter chunks with reasonable relevance
        valid_chunks = [c for c in context_chunks if c.get("similarity", 0) >= 0.25]
        if not valid_chunks:
            return FALLBACK_NO_CONTEXT_ANSWER

        # Top relevant context
        best_chunk = valid_chunks[0]
        text = best_chunk["text"]

        # If best chunk is an event or FAQ format, present clean answer
        if "Official Answer:" in text:
            match = re.search(r"Official Answer:\s*(.+)", text, re.DOTALL)
            if match:
                return match.group(1).strip()

        # If it's an event specification, extract key properties
        if "EVENT SPECIFICATION:" in text or "Rules & Guidelines:" in text:
            return text.strip()

        # Clean markdown headers if standard text
        cleaned_text = re.sub(r'\[.*?\]\n', '', text).strip()
        if len(cleaned_text) > 20:
            return cleaned_text

        return FALLBACK_NO_CONTEXT_ANSWER

def get_provider_instance(provider_name: str) -> Optional[BaseLLMProvider]:
    name = (provider_name or "").lower().strip()
    if name == "groq":
        return GroqProvider()
    elif name == "gemini":
        return GeminiProvider()
    elif name in ("openai", "gpt"):
        return OpenAIProvider()
    return None

class LLMManager:
    def __init__(self):
        self.primary_name = os.getenv("LLM_PROVIDER", DEFAULT_PRIMARY_PROVIDER)
        self.secondary_name = os.getenv("SECONDARY_LLM_PROVIDER", DEFAULT_SECONDARY_PROVIDER)
        self.context_synthesizer = ContextSynthesizerFallback()

    def generate_answer(self, context_chunks: List[Dict[str, Any]], question: str) -> Dict[str, Any]:
        """
        Generate answer using RAG context with multi-provider resilience.
        Attempts Primary -> Secondary -> Local Context Synthesizer.
        """
        # Format context block
        context_texts = [c["text"] for c in context_chunks]
        context_str = "\n\n---\n\n".join(context_texts) if context_texts else "No matching context found."

        system_prompt = SYSTEM_RAG_PROMPT.format(context=context_str)
        user_prompt = USER_QUESTION_PROMPT.format(question=question)

        # 1. Try Primary LLM Provider
        primary = get_provider_instance(self.primary_name)
        if primary and getattr(primary, "api_key", None):
            try:
                print(f"[LLM] Querying primary provider: {self.primary_name}...")
                ans = primary.generate(system_prompt, user_prompt)
                if ans:
                    return {
                        "answer": ans,
                        "source": "llm",
                        "provider": self.primary_name,
                        "cached": False
                    }
            except Exception as e:
                print(f"[LLM Warning] Primary provider ({self.primary_name}) failed: {e}")

        # 2. Try Secondary Fallback LLM Provider
        if self.secondary_name and self.secondary_name != self.primary_name:
            secondary = get_provider_instance(self.secondary_name)
            if secondary and getattr(secondary, "api_key", None):
                try:
                    print(f"[LLM] Attempting secondary fallback provider: {self.secondary_name}...")
                    ans = secondary.generate(system_prompt, user_prompt)
                    if ans:
                        return {
                            "answer": ans,
                            "source": "llm_fallback",
                            "provider": self.secondary_name,
                            "cached": False
                        }
                except Exception as e:
                    print(f"[LLM Warning] Secondary provider ({self.secondary_name}) failed: {e}")

        # 3. Fallback: Local Context Synthesis (Never crashes, never fabricates)
        print("[LLM] Generating context-based safe response from retrieved RAG documents...")
        fallback_ans = self.context_synthesizer.generate_from_context(context_chunks, question)
        source_label = "rag" if fallback_ans != FALLBACK_NO_CONTEXT_ANSWER else "fallback"

        return {
            "answer": fallback_ans,
            "source": source_label,
            "provider": "local_context_synthesizer",
            "cached": False
        }

# Global singleton
_llm_manager = None

def get_llm_manager() -> LLMManager:
    global _llm_manager
    if _llm_manager is None:
        _llm_manager = LLMManager()
    return _llm_manager
