# app/routers/materials.py
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel, Field
from typing import Literal, List, Dict, Any
from datetime import datetime
from pathlib import Path
import uuid, json

router = APIRouter(prefix="/materials", tags=["materials"])

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
MATERIALS_FILE = DATA_DIR / "materials.json"

def _read_json(path: Path) -> list:
    if not path.exists(): return []
    return json.loads(path.read_text("utf-8"))

def _write_json(path: Path, data: list):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")

class MaterialIn(BaseModel):
    user_id: str = Field(..., description="ID studente")
    title: str
    type: Literal["pdf","image","docx","link","text"] = "link"
    src_url: str | None = None         # per pdf/link/immagine/docx
    plain_text: str | None = None      # per incolla testo
    category: str | None = None

class MaterialOut(MaterialIn):
    id: str
    created_at: str
    ocr_text: str | None = None        # (placeholder: non OCR in MVP)

@router.post("", response_model=MaterialOut)
def create_material(payload: MaterialIn = Body(...)):
    if not payload.src_url and not payload.plain_text:
        raise HTTPException(400, "Fornire src_url oppure plain_text")

    items = _read_json(MATERIALS_FILE)
    mid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    item = payload.model_dump()
    item.update({"id": mid, "created_at": now, "ocr_text": payload.plain_text or None})
    items.append(item)
    _write_json(MATERIALS_FILE, items)
    return item

@router.get("", response_model=List[MaterialOut])
def list_materials(user_id: str = Query(...)):
    items = _read_json(MATERIALS_FILE)
    return [x for x in items if x.get("user_id") == user_id]

@router.get("/{material_id}", response_model=MaterialOut)
def get_material(material_id: str):
    items = _read_json(MATERIALS_FILE)
    for x in items:
        if x["id"] == material_id:
            return x
    raise HTTPException(404, "Materiale non trovato")

@router.delete("/{material_id}")
def delete_material(material_id: str):
    items = _read_json(MATERIALS_FILE)
    new_items = [x for x in items if x["id"] != material_id]
    if len(new_items) == len(items):
        raise HTTPException(404, "Materiale non trovato")
    _write_json(MATERIALS_FILE, new_items)
    return {"ok": True}
