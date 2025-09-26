# backend/app/main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os

# -----------------------------
# CONFIG inline (no settings.py)
# -----------------------------
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@eccomi.edu")
ADMIN_PASSWORD_PLAIN = os.getenv("ADMIN_PASSWORD_PLAIN", "changeme")
JWT_SECRET = os.getenv("JWT_SECRET", "devsecret")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")

# -----------------------------
# MODELS inline (no models.py)
# -----------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    email: EmailStr
    role: str
    plan: str
    name: str

class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

# -----------------------------
# AUTH inline (no auth.py)
# -----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    # Se ADMIN_PASSWORD_PLAIN cambia ad ogni boot, ricalcoliamo l'hash:
    return pwd_context.verify(password, password_hash)

def create_access_token(*, data: dict, secret: str, algo: str, expires_minutes: int = 120) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(to_encode, secret, algorithm=algo)

def current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = creds.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Token mancante")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token non valido")

# -----------------------------
# FASTAPI
# -----------------------------
app = FastAPI(title="Eccomi Edu API", version="0.1")

# CORS aperto per MVP (stringi in prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# ADMIN seed (in memoria)
ADMIN = {
    "email": ADMIN_EMAIL,
    "password_hash": hash_password(ADMIN_PASSWORD_PLAIN),
    "role": "admin",
    "plan": "owner_full",
    "name": "Eccomi Admin",
}

@app.get("/health")
def health():
    return {"ok": True, "marker": "v3"}

@app.post("/auth/login", response_model=LoginOut)
def login(payload: LoginIn):
    if payload.email.lower() != ADMIN["email"].lower() or not verify_password(payload.password, ADMIN["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = create_access_token(
        data={"sub": ADMIN["email"], "role": ADMIN["role"], "plan": ADMIN["plan"]},
        secret=JWT_SECRET,
        algo=JWT_ALGO,
        expires_minutes=120,
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": ADMIN["email"], "role": ADMIN["role"], "plan": ADMIN["plan"], "name": ADMIN["name"]},
    }

@app.get("/me", response_model=User)
def me(user=Depends(current_user)):
    return User(email=ADMIN["email"], role=ADMIN["role"], plan=ADMIN["plan"], name=ADMIN["name"])

# -----------------------------
# Routers esistenti (lasciamo invariati)
# -----------------------------
from .routers import materials, ai_tools, repetition, upload
app.include_router(materials.router)
app.include_router(ai_tools.router)
app.include_router(repetition.router)
app.include_router(upload.router)
