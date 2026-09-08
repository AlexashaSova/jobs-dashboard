"""Налаштування застосунку.

Значення читаються зі змінних середовища або з файлу .env
у корені проєкту. Назви змінних у .env — великими літерами
(CH_HOST), а тут — маленькими (ch_host); pydantic зіставляє
їх сам.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/config.py -> parents[2] = корінь проєкту
ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    ch_host: str = "localhost"
    ch_port: int = 8123
    ch_user: str = "dash"
    ch_password: str = "dash"
    ch_database: str = "jobs"

    # де лежать SQL-файли віджетів
    queries_dir: Path = ROOT_DIR / "sql" / "queries"

    # зібраний фронтенд (npm run build); якщо папка є — FastAPI віддає її сам
    frontend_dist: Path = ROOT_DIR / "frontend" / "dist"

    # скільки секунд тримати результат запиту в кеші
    cache_ttl_seconds: int = 300

    # звідки дозволено ходити до API з браузера (крок 3)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
