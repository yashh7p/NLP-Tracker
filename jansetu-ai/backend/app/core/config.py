"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import List
from pathlib import Path
import os

# Backend root directory (jansetu-ai/backend)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
CANONICAL_DB_FILE = (BACKEND_DIR / "jansetu.db").resolve()


class Settings(BaseSettings):
    APP_NAME: str = "JanSetu AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    DATABASE_URL: str = f"sqlite+aiosqlite:///{CANONICAL_DB_FILE.as_posix()}"
    SYNC_DATABASE_URL: str = f"sqlite:///{CANONICAL_DB_FILE.as_posix()}"

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    UPLOAD_DIR: str = str((BACKEND_DIR / "uploads").resolve())
    MAX_UPLOAD_SIZE_MB: int = 10

    ML_MODELS_DIR: str = str((BACKEND_DIR.parent / "ml" / "models").resolve())
    DEFAULT_MODEL: str = "svm"

    STT_PROVIDER: str = "browser"
    GEOCODING_PROVIDER: str = "nominatim"
    NOMINATIM_USER_AGENT: str = "jansetu-ai/1.0"

    LOG_LEVEL: str = "INFO"

    @model_validator(mode="after")
    def resolve_paths(self):
        # Always resolve relative sqlite URLs to the canonical backend/jansetu.db
        if "sqlite" in self.DATABASE_URL:
            db_spec = self.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
            if db_spec.startswith("./") or not os.path.isabs(db_spec):
                self.DATABASE_URL = f"sqlite+aiosqlite:///{CANONICAL_DB_FILE.as_posix()}"

        if "sqlite" in self.SYNC_DATABASE_URL:
            db_spec = self.SYNC_DATABASE_URL.replace("sqlite:///", "")
            if db_spec.startswith("./") or not os.path.isabs(db_spec):
                self.SYNC_DATABASE_URL = f"sqlite:///{CANONICAL_DB_FILE.as_posix()}"

        upload_path = Path(self.UPLOAD_DIR)
        if not upload_path.is_absolute():
            self.UPLOAD_DIR = str((BACKEND_DIR / upload_path).resolve())

        ml_path = Path(self.ML_MODELS_DIR)
        if not ml_path.is_absolute():
            self.ML_MODELS_DIR = str((BACKEND_DIR / ml_path).resolve())

        return self

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
