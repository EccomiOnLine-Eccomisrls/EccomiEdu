from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

def create_access_token(*, data: dict, secret: str, algo: str, expires_minutes: int = 120) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=algo)

def current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = creds.credentials
    if not token:
        raise HTTPException(status_code=401, detail="Token mancante")
    try:
        payload = jwt.decode(token, "devsecret", algorithms=["HS256"])
        # NOTA: qui sopra metti i valori reali dal tuo settings in un progetto più grande
        # In questo MVP non usiamo i claims oltre a 'sub'
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token non valido")
