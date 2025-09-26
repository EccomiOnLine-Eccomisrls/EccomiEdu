from pydantic import BaseModel
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "Eccomi Edu"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-please")
    JWT_ALGO: str = "HS256"
    # admin seed (MVP): cambia appena possibile
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@eccomi.edu")
    ADMIN_PASSWORD_PLAIN: str = os.getenv("ADMIN_PASSWORD_PLAIN", "EccomiAdmin!2025")

def get_settings() -> Settings:
    return Settings()
