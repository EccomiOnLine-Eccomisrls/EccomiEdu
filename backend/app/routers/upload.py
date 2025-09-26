# app/routers/upload.py
from __future__ import annotations
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
import json, uuid, shutil, mimetypes

router = APIRouter(prefix="/upload", tags=["upload"])

DATA_DIR = Path("data"); DATA_DIR.mkdir(exist_ok=True)
UP_DIR = DATA_DIR / "uploads"; UP_DIR.mkdir(parents=True, exist_ok=True)
MATERIALS_FILE = DATA_DIR / "materials.json"

def _read_json(p: Path) -> list:
    if not p.exists(): return []
    return json.loads(p.read_text("utf-8"))
def _write_json(p: Path, d: list):
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2), "utf-8")

@router.post("/material")
async def upload_material(
    user_id: str = Form(...),
    title: str = Form(...),
    category: str | None = Form(None),
    file: UploadFile = File(...),
):
    # convalida tipo base (immagini, pdf, docx)
    allowed = {
        "image/jpeg","image/png","image/webp",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    ctype = file.content_type or mimetypes.guess_type(file.filename)[0] or ""
    if ctype not in allowed:
        raise HTTPException(400, f"Tipo file non supportato: {ctype}")

    # salva su disco
    mid = str(uuid.uuid4())
    # preserva estensione
    ext = Path(file.filename).suffix or ".bin"
    dest = UP_DIR / f"{mid}{ext}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # registra come materiale
    items = _read_json(MATERIALS_FILE)
    rec = {
        "id": mid,
        "user_id": user_id,
        "title": title,
        "type": "file",
        "src_url": None,
        "file_path": str(dest),
        "category": category,
        "created_at": datetime.utcnow().isoformat(),
        "ocr_text": None,   # potenzieremo con OCR/TXT più avanti
    }
    items.append(rec); _write_json(MATERIALS_FILE, items)
    return {"ok": True, "id": mid, "filename": file.filename, "content_type": ctype}
