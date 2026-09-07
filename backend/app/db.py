"""Підключення до ClickHouse через HTTP (порт 8123)."""
from functools import lru_cache
from typing import Any

import clickhouse_connect
from clickhouse_connect.driver.client import Client

from .config import settings


@lru_cache
def get_client() -> Client:
    """Один клієнт на весь застосунок (створюється при першому виклику)."""
    return clickhouse_connect.get_client(
        host=settings.ch_host,
        port=settings.ch_port,
        username=settings.ch_user,
        password=settings.ch_password,
        database=settings.ch_database,
    )


def run_query(sql: str, parameters: dict[str, Any] | None = None) -> list[dict]:
    """Виконує запит і повертає список рядків у вигляді словників.

    parameters підставляються у {name:Type} на боці сервера,
    тому SQL-ін'єкції неможливі.
    """
    result = get_client().query(sql, parameters=parameters or {})
    return list(result.named_results())
