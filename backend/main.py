from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from .settings import get_settings
from .models import LoginIn, LoginOut, User
from .auth import create_access_token, hash_password, verify_password, current_user
from . import materials

app = FastAPI(title="Eccomi Edu API")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restringi in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed admin in memoria (MVP)
ADMIN = {
    "email": settings.ADMIN_EMAIL,
    "password_hash": hash_password(settings.ADMIN_PASSWORD_PLAIN),
    "role": "admin",
    "plan": "owner_full",
    "name": "Eccomi Admin"
}

@app.get("/health")
def health():
    return {"ok": True, "service": "eccomi-edu"}

@app.post("/auth/login", response_model=LoginOut)
def login(payload: LoginIn):
    if payload.email.lower() != ADMIN["email"].lower() or not verify_password(payload.password, ADMIN["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = create_access_token(
        data={"sub": ADMIN["email"], "role": ADMIN["role"], "plan": ADMIN["plan"]},
        secret=settings.JWT_SECRET,
        algo=settings.JWT_ALGO,
        expires_minutes=120
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": ADMIN["email"], "role": ADMIN["role"], "plan": ADMIN["plan"], "name": ADMIN["name"]}
    }

@app.get("/me", response_model=User)
def me(user=Depends(current_user)):
    return User(email=ADMIN["email"], role=ADMIN["role"], plan=ADMIN["plan"], name=ADMIN["name"])

# routers
app.include_router(materials.router)
