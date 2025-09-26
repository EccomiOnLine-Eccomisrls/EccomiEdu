# app/routers/ai_tools.py
from __future__ import annotations
from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
import uuid, json, re

router = APIRouter(prefix="/ai", tags=["ai"])

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
ARTIFACTS_FILE = DATA_DIR / "artifacts.json"

def _read_json(path: Path) -> list:
    if not path.exists(): return []
    return json.loads(path.read_text("utf-8"))
def _write_json(path: Path, data: list):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")

# ===== Inputs =====
class TextIn(BaseModel):
    user_id: str
    material_id: str | None = None
    text: str
    n: int | None = 20

# ===== Endpoints =====
@router.post("/summarize")
def summarize(payload: TextIn = Body(...)):
    txt = payload.text.strip()
    if not txt: raise HTTPException(400, "text vuoto")

    # --- MVP: euristiche semplici (hook per LLM/TTS in futuro) ---
    sentences = re.split(r'(?<=[\.\?!])\s+', txt)
    summary = " ".join(sentences[:5])[:1200]
    keywords = list({w.lower() for w in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]{4,}", txt)})[:15]
    glossary = [{"term": k, "definition": f"Definizione semplificata di {k}."} for k in keywords[:8]]

    art = {
        "id": str(uuid.uuid4()),
        "user_id": payload.user_id,
        "material_id": payload.material_id,
        "kind": "summary",
        "data": {"summary": summary, "keywords": keywords, "glossary": glossary},
    }
    items = _read_json(ARTIFACTS_FILE); items.append(art); _write_json(ARTIFACTS_FILE, items)
    return art

@router.post("/cornell")
def cornell(payload: TextIn = Body(...)):
    txt = payload.text.strip()
    if not txt: raise HTTPException(400, "text vuoto")

    # super-semplice: cue = domande/keyword; notes = testo; summary = 5 frasi
    questions = [f"Cosa significa: {k}?" for k in list({w for w in re.findall(r'[A-Za-zÀ-ÖØ-öø-ÿ]{6,}', txt)})[:10]]
    notes = "\n".join(re.split(r'\n+', txt)[:20])[:3000]
    summary_sentences = re.split(r'(?<=[\.\?!])\s+', txt)[:5]
    summary = " ".join(summary_sentences)

    art = {
        "id": str(uuid.uuid4()),
        "user_id": payload.user_id,
        "material_id": payload.material_id,
        "kind": "cornell",
        "data": {"cue": questions, "notes": notes, "summary": summary},
    }
    items = _read_json(ARTIFACTS_FILE); items.append(art); _write_json(ARTIFACTS_FILE, items)
    return art

@router.post("/flashcards")
def flashcards(payload: TextIn = Body(...)):
    txt = payload.text.strip()
    if not txt: raise HTTPException(400, "text vuoto")
    words = list({w for w in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]{5,}", txt)})
    N = max(5, min(payload.n or 20, 50))
    pairs = [{"q": f"Definisci: {w}", "a": f"{w}: spiegazione in 1 frase."} for w in words[:N]]

    art = {
        "id": str(uuid.uuid4()),
        "user_id": payload.user_id,
        "material_id": payload.material_id,
        "kind": "flashcards",
        "data": {"cards": pairs},
    }
    items = _read_json(ARTIFACTS_FILE); items.append(art); _write_json(ARTIFACTS_FILE, items)
    return art

@router.post("/quiz")
def quiz(payload: TextIn = Body(...)):
    txt = payload.text.strip()
    if not txt: raise HTTPException(400, "text vuoto")
    nouns = list({w for w in re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]{6,}", txt)})
    N = max(5, min(payload.n or 10, 20))
    qs = []
    for i, w in enumerate(nouns[:N], 1):
        qs.append({
            "type": "mcq",
            "q": f"Cos'è {w}?",
            "choices": [f"Definizione corretta di {w}", f"Opzione 2", f"Opzione 3", f"Opzione 4"],
            "answer_index": 0
        })
    art = {
        "id": str(uuid.uuid4()),
        "user_id": payload.user_id,
        "material_id": payload.material_id,
        "kind": "quiz",
        "data": {"questions": qs},
    }
    items = _read_json(ARTIFACTS_FILE); items.append(art); _write_json(ARTIFACTS_FILE, items)
    return art

@router.get("/artifacts/{user_id}")
def list_artifacts(user_id: str):
    items = _read_json(ARTIFACTS_FILE)
    return [x for x in items if x.get("user_id") == user_id]
