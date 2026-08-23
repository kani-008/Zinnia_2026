"""
Document ingestion script for Zinnia Symposium Knowledge Base.
Parses markdown documents, events.json, and faq.json, chunks them logically,
generates embeddings, and stores them in ChromaDB.
"""

import os
import json
import re
import argparse
from typing import List, Dict, Any
from .embeddings import get_embedding_manager
from .retriever import get_retriever, COLLECTION_NAME

BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
KNOWLEDGE_DIR = os.path.join(BACKEND_DIR, "knowledge")
DOCS_DIR = os.path.join(KNOWLEDGE_DIR, "documents")
EVENTS_JSON_PATH = os.path.join(KNOWLEDGE_DIR, "events.json")
FAQ_JSON_PATH = os.path.join(KNOWLEDGE_DIR, "faq.json")

def split_markdown_by_headers(text: str, filename: str) -> List[Dict[str, Any]]:
    """Splits markdown file into coherent sections based on H1/H2/H3 headers."""
    chunks = []
    lines = text.split("\n")
    current_title = os.path.splitext(filename)[0].replace("_", " ").title()
    current_section = "General Information"
    current_lines = []

    for line in lines:
        if line.startswith("# "):
            if current_lines:
                chunk_text = "\n".join(current_lines).strip()
                if len(chunk_text) > 40:
                    chunks.append({
                        "text": f"[{current_title} - {current_section}]\n{chunk_text}",
                        "metadata": {
                            "source": filename,
                            "section": current_section,
                            "doc_type": "handbook"
                        }
                    })
                current_lines = []
            current_title = line.replace("# ", "").strip()
            current_section = current_title
        elif line.startswith("## ") or line.startswith("### "):
            if current_lines:
                chunk_text = "\n".join(current_lines).strip()
                if len(chunk_text) > 40:
                    chunks.append({
                        "text": f"[{current_title} - {current_section}]\n{chunk_text}",
                        "metadata": {
                            "source": filename,
                            "section": current_section,
                            "doc_type": "handbook"
                        }
                    })
                current_lines = []
            current_section = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        chunk_text = "\n".join(current_lines).strip()
        if len(chunk_text) > 40:
            chunks.append({
                "text": f"[{current_title} - {current_section}]\n{chunk_text}",
                "metadata": {
                    "source": filename,
                    "section": current_section,
                    "doc_type": "handbook"
                }
            })

    return chunks

def parse_events_json(path: str) -> List[Dict[str, Any]]:
    """Parses events.json into rich searchable event chunks."""
    if not os.path.exists(path):
        return []

    chunks = []
    with open(path, "r", encoding="utf-8") as f:
        events = json.load(f)

    for ev in events:
        code = ev.get("code", "")
        name = ev.get("mission_name", "")
        title = ev.get("title", "")
        category = ev.get("category", "")
        event_type = ev.get("event_type", "")
        venue = ev.get("venue", "")
        schedule = ev.get("schedule_time", "")
        duration = ev.get("duration", "")
        team_min = ev.get("team_size_min", 1)
        team_max = ev.get("team_size_max", 1)
        desc = ev.get("description", "")
        rules = "\n".join([f"- {r}" for r in ev.get("rules", [])])
        coords = ", ".join([f"{c['name']} ({c['role']}: {c['phone']})" for c in ev.get("coordinators", [])])
        prizes = f"1st: {ev.get('prizes', {}).get('first', '')} | 2nd: {ev.get('prizes', {}).get('second', '')} | 3rd: {ev.get('prizes', {}).get('third', '')}"

        event_text = (
            f"EVENT SPECIFICATION: {code} - {name} ({title})\n"
            f"Category: {category} ({event_type})\n"
            f"Timing: {schedule} (Duration: {duration})\n"
            f"Venue: {venue}\n"
            f"Team Size: {team_min} to {team_max} members\n"
            f"Description: {desc}\n"
            f"Rules & Guidelines:\n{rules}\n"
            f"Prizes: {prizes}\n"
            f"Coordinators: {coords}"
        )

        chunks.append({
            "text": event_text,
            "metadata": {
                "source": "events.json",
                "event_id": ev.get("id", ""),
                "event_code": code,
                "event_name": name,
                "category": category,
                "doc_type": "event_details"
            }
        })

    return chunks

def parse_faq_json(path: str) -> List[Dict[str, Any]]:
    """Parses faq.json into Q&A knowledge chunks."""
    if not os.path.exists(path):
        return []

    chunks = []
    with open(path, "r", encoding="utf-8") as f:
        faqs = json.load(f)

    for faq in faqs:
        q = faq.get("question", "")
        ans = faq.get("answer", "")
        cat = faq.get("category", "FAQ")
        variations = ", ".join(faq.get("variations", []))

        text = (
            f"FAQ - CATEGORY: {cat}\n"
            f"Question: {q}\n"
            f"Related phrasing: {variations}\n"
            f"Official Answer: {ans}"
        )

        chunks.append({
            "text": text,
            "metadata": {
                "source": "faq.json",
                "faq_id": faq.get("id", ""),
                "category": cat,
                "doc_type": "faq"
            }
        })

    return chunks

def run_ingestion(force: bool = False) -> Dict[str, Any]:
    """Execute knowledge base document ingestion into ChromaDB."""
    retriever = get_retriever()
    current_count = retriever.count()

    if current_count > 0 and not force:
        print(f"[Ingestion] ChromaDB already contains {current_count} documents. Skipping (use force=True to re-index).")
        return {"status": "skipped", "document_count": current_count}

    print("[Ingestion] Starting ingestion process...")
    all_chunks: List[Dict[str, Any]] = []

    # 1. Ingest markdown documents
    if os.path.exists(DOCS_DIR):
        for fname in os.listdir(DOCS_DIR):
            if fname.endswith(".md") or fname.endswith(".txt"):
                fpath = os.path.join(DOCS_DIR, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                chunks = split_markdown_by_headers(content, fname)
                all_chunks.extend(chunks)
                print(f"  [+] Ingested {len(chunks)} chunks from {fname}")

    # 2. Ingest events.json
    event_chunks = parse_events_json(EVENTS_JSON_PATH)
    all_chunks.extend(event_chunks)
    print(f"  [+] Ingested {len(event_chunks)} chunks from events.json")

    # 3. Ingest faq.json
    faq_chunks = parse_faq_json(FAQ_JSON_PATH)
    all_chunks.extend(faq_chunks)
    print(f"  [+] Ingested {len(faq_chunks)} chunks from faq.json")

    if not all_chunks:
        print("[Ingestion Error] No chunks generated. Check knowledge directory.")
        return {"status": "error", "message": "No documents found"}

    # 4. Generate Embeddings & Push to ChromaDB
    print(f"[Ingestion] Generating embeddings for {len(all_chunks)} chunks...")
    embedding_mgr = get_embedding_manager()
    doc_texts = [c["text"] for c in all_chunks]
    metadatas = [c["metadata"] for c in all_chunks]
    ids = [f"chunk_{i:04d}" for i in range(len(all_chunks))]

    embeddings = embedding_mgr.embed_documents(doc_texts)

    # If force, delete existing collection items first
    if force and current_count > 0:
        try:
            print("[Ingestion] Clearing previous collection items...")
            retriever.client.delete_collection(COLLECTION_NAME)
            retriever._init_chroma()
        except Exception as e:
            print(f"[Ingestion Warning] Could not reset collection: {e}")

    print("[Ingestion] Writing to ChromaDB...")
    retriever.collection.add(
        ids=ids,
        documents=doc_texts,
        metadatas=metadatas,
        embeddings=embeddings
    )

    final_count = retriever.count()
    print(f"[Ingestion Complete] Successfully indexed {final_count} knowledge chunks into ChromaDB.")
    return {"status": "success", "indexed_chunks": final_count}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest symposium documents into ChromaDB")
    parser.add_argument("--force", action="store_true", help="Force re-indexing even if DB is not empty")
    args = parser.parse_args()
    run_ingestion(force=args.force)
