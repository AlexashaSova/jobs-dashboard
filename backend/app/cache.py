"""Простий кеш у пам'яті з часом життя (TTL).

Дашборд оновлюється часто, а дані — ні. Тому однаковий запит
з однаковими фільтрами не варто ганяти в базу щоразу.
"""
import time
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        item = self._store.get(key)
        if item is None:
            return None
        expires_at, value = item
        if time.time() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (time.time() + self.ttl, value)

    def clear(self) -> None:
        self._store.clear()
