import os, uuid
from pathlib import Path
from typing import Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from .auth import current_user
from .models import MaterialOut, SummaryOut

router = APIRouter(prefix="/materials", tags=["materials"])

STORAGE_DIR = Path(os.getenv("EC_STOR_DIR", "./_storage"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# semplice store in memoria (MVP)
MATERIALS: Dict[str, dict] = {}

@router.post("/upload", response_model=MaterialOut)
async def upload_material(file: UploadFile = File(...), user=Depends(current_user)):
    # Render non fornisce sempre file.size; controlla lunghezza dopo read
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File troppo grande (max 15MB) in MVP")
    mat_id = str(uuid.uuid4())
    dest = STORAGE_DIR / f"{mat_id}__{file.filename}"
    dest.write_bytes(content)
    MATERIALS[mat_id] = {
        "id": mat_id,
        "filename": file.filename,
        "size": len(content),
        "mime": file.content_type or "application/octet-stream",
        "path": str(dest),
        "owner": user.sub,
        "status": "stored",
        "text_preview": content[:4000].decode(errors="ignore")
    }
    return {
        "id": mat_id,
        "filename": file.filename,
        "size": len(content),
        "mime": MATERIALS[mat_id]["mime"],
        "status": "stored"
    }

@router.post("/{material_id}/summary", response_model=SummaryOut)
async def summarize_material(material_id: str, user=Depends(current_user)):
    m = MATERIALS.get(material_id)
    if not m:
        raise HTTPException(status_code=404, detail="Materiale non trovato")
    txt = m.get("text_preview","")
    if not txt:
        summary = "Nessun testo rilevato. Carica un PDF/testo per ottenere un riassunto."
    else:
        snippet = txt.strip().replace("\n", " ")
        summary = (snippet[:420] + "…") if len(snippet) > 420 else snippet
        if not summary:
            summary = "Testo non leggibile in MVP. (OCR/PDF parsing arriverà nello step successivo)"
    return SummaryOut(material_id=material_id, summary=summary, meta={"filename": m["filename"], "mime": m["mime"]})
