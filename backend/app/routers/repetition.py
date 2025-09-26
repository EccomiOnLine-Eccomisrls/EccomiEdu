# app/routers/repetition.py
from __future__ import annotations
from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import date, timedelta
from pathlib import Path
import json, uuid

router = APIRouter(prefix="/repetition", tags=["repetition"])

DATA_DIR = Path("data"); DATA_DIR.mkdir(exist_ok=True)
REP_FILE = DATA_DIR / "repetition.json"
ART_FILE = DATA_DIR / "artifacts.json"

def _r(path: Path) -> list:
    if not path.exists(): return []
    return json.loads(path.read_text("utf-8"))
def _w(path: Path, data: list):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), "utf-8")

class SeedIn(BaseModel):
    user_id: str
    artifact_id: str  # tipicamente un artifact "flashcards"
class ReviewIn(BaseModel):
    user_id: str
    card_id: str
    grade: int  # 0-5

@router.post("/seed")
def seed(payload: SeedIn = Body(...)):
    artifacts = _r(ART_FILE)
    art = next((x for x in artifacts if x["id"] == payload.artifact_id and x["user_id"] == payload.user_id), None)
    if not art or art["kind"] != "flashcards":
        raise HTTPException(404, "artifact flashcards non trovato")
    reps = _r(REP_FILE)
    today = date.today().isoformat()
    for idx, c in enumerate(art["data"]["cards"]):
        cid = str(uuid.uuid4())
        reps.append({
            "id": cid,
            "user_id": payload.user_id,
            "q": c["q"], "a": c["a"],
            "ease": 2.5, "interval": 0, "reps": 0,
            "due_at": today
        })
    _w(REP_FILE, reps)
    return {"ok": True, "seeded": len(art["data"]["cards"])}

@router.get("/today")
def today(user_id: str = Query(...)):
    reps = _r(REP_FILE)
    today_s = date.today().isoformat()
    due = [x for x in reps if x["user_id"] == user_id and x["due_at"] <= today_s]
    return {"count": len(due), "cards": due[:50]}

@router.post("/review")
def review(payload: ReviewIn = Body(...)):
    if payload.grade < 0 or payload.grade > 5:
        raise HTTPException(400, "grade 0-5")
    reps = _r(REP_FILE); changed = False
    today_d = date.today()
    for x in reps:
        if x["id"] == payload.card_id and x["user_id"] == payload.user_id:
            ease = x.get("ease", 2.5)
            interval = x.get("interval", 0)
            reps_cnt = x.get("reps", 0)

            if payload.grade < 3:
                interval = 1
                reps_cnt = 0
            else:
                if reps_cnt == 0:
                    interval = 1
                elif reps_cnt == 1:
                    interval = 6
                else:
                    ease = max(1.3, ease + 0.1 - (5 - payload.grade)*(0.08 + (5 - payload.grade)*0.02))
                    interval = round(interval * ease)
                reps_cnt += 1

            next_due = (today_d + timedelta(days=max(1, interval))).isoformat()
            x.update({"ease": ease, "interval": interval, "reps": reps_cnt, "due_at": next_due})
            changed = True
            break
    if not changed: raise HTTPException(404, "card non trovata")
    _w(REP_FILE, reps)
    return {"ok": True}
