from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, Dict, Any

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class User(BaseModel):
    email: EmailStr
    role: Literal["admin", "docente", "studente", "owner"] = "admin"
    plan: str = "owner_full"
    name: str = "Eccomi Admin"

class TokenData(BaseModel):
    sub: EmailStr
    role: str
    plan: str

class MaterialOut(BaseModel):
    id: str
    filename: str
    size: int
    mime: str
    status: Literal["stored","processed"] = "stored"

class SummaryOut(BaseModel):
    material_id: str
    summary: str
    meta: Dict[str, Any] = {}
