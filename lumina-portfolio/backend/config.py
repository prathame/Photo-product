from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"


class Settings(BaseSettings):
    """Application settings sourced from environment variables when available."""

    admin_password: str = "admin"
    api_prefix: str = "/api"
    cors_origins: List[AnyHttpUrl | str] = ["*"]
    database_url: str = f"sqlite:///{(DATA_DIR / 'lumina.db').as_posix()}"
    max_image_width: int = 2000
    uploads_dir: Path = UPLOADS_DIR
    frontend_dist: Optional[Path] = (BASE_DIR.parent / "dist").resolve()

    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance and ensure required folders exist."""

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    settings = Settings()
    uploads_path = Path(settings.uploads_dir)
    uploads_path.mkdir(parents=True, exist_ok=True)
    return settings

