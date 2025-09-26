import os
from functools import lru_cache
from pydantic import BaseModel

class Settings(BaseModel):
    ADMIN_EMAIL: str = "admin@eccomi.edu"
    ADMIN_PASSWORD_PLAIN: str = "changeme"
    JWT_SECRET: str = "devsecret"
    JWT_ALGO: str = "HS256"

@lru_cache
def get_settings() -> Settings:
    return Settings(
        ADMIN_EMAIL=os.getenv("ADMIN_EMAIL", "admin@eccomi.edu"),
        ADMIN_PASSWORD_PLAIN=os.getenv("ADMIN_PASSWORD_PLAIN", "changeme"),
        JWT_SECRET=os.getenv("JWT_SECRET", "devsecret"),
        JWT_ALGO=os.getenv("JWT_ALGO", "HS256"),
    )
