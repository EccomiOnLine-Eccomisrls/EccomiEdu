from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import materials, ai_tools, repetition

app = FastAPI(title="Eccomi Edu API", version="0.1")

# CORS aperto per MVP (da chiudere su domini tuoi in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # in produzione: ["https://tuo-dominio", "https://tuo-static"]
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

app.include_router(materials.router)
app.include_router(ai_tools.router)
app.include_router(repetition.router)

@app.get("/health")
def health():
    return {"ok": True}
