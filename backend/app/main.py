# app/main.py (estratto)
from fastapi import FastAPI
from app.routers import materials, ai_tools, repetition

app = FastAPI(title="Eccomi Edu API", version="0.1")

app.include_router(materials.router)
app.include_router(ai_tools.router)
app.include_router(repetition.router)

@app.get("/health")
def health(): return {"ok": True}
