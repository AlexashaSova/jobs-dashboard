"""Точка входу FastAPI.

Запуск для розробки (з папки backend/):
    uvicorn app.main:app --reload --port 8000

Інтерактивна документація: http://localhost:8000/docs
"""
import json

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .cache import TTLCache
from .config import settings
from .db import run_query
from .filters import Filters, filters_from_query
from .queries import load_widgets

app = FastAPI(
    title="Jobs Market Dashboard API",
    description="Аналітика вакансій LinkedIn (2023–2024) поверх ClickHouse.",
    version="0.1.0",
)

# Дозволяємо фронтенду (інший порт = інший origin) звертатись до API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

cache = TTLCache(settings.cache_ttl_seconds)


def _cached_query(key: str, sql: str, params: dict) -> list[dict]:
    rows = cache.get(key)
    if rows is None:
        try:
            rows = run_query(sql, params)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=f"ClickHouse error: {exc}") from exc
        cache.set(key, rows)
    return rows


@app.get("/api/health", tags=["service"])
def health():
    """Чи жива база і скільки в ній вакансій."""
    try:
        rows = run_query("SELECT version() AS version, (SELECT count() FROM postings) AS postings")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"ClickHouse unavailable: {exc}") from exc
    return {"status": "ok", "clickhouse": rows[0]["version"], "postings": rows[0]["postings"]}


@app.get("/api/widgets", tags=["widgets"])
def list_widgets():
    """Перелік доступних віджетів (по одному на SQL-файл)."""
    return [
        {
            "name": w.name,
            "order": w.order,
            "description": w.description,
            "chart": w.chart,
            "uses_filters": w.uses_filters,
        }
        for w in sorted(load_widgets().values(), key=lambda w: w.order)
    ]


@app.get("/api/filters", tags=["widgets"])
def filter_options():
    """Значення для випадаючих списків фільтрів."""
    widget = load_widgets().get("filter_options")
    if widget is None:
        raise HTTPException(status_code=500, detail="00_filter_options.sql not found")

    rows = _cached_query("filter_options", widget.sql, {})
    grouped: dict[str, list[dict]] = {"month": [], "exp_level": [], "work_type": []}
    for row in rows:
        grouped.setdefault(row["filter"], []).append(
            {"value": row["value"], "postings": row["postings"]}
        )
    return {
        "months": grouped["month"],
        "levels": grouped["exp_level"],
        "work_types": grouped["work_type"],
    }


@app.get("/api/widgets/{name}", tags=["widgets"])
def widget_data(name: str, filters: Filters = Depends(filters_from_query)):
    """Дані одного віджета з урахуванням фільтрів."""
    widget = load_widgets().get(name)
    if widget is None:
        raise HTTPException(status_code=404, detail=f"Unknown widget '{name}'")

    params = filters.to_clickhouse() if widget.uses_filters else {}
    key = name + ":" + json.dumps(params, sort_keys=True)
    rows = _cached_query(key, widget.sql, params)

    return {
        "widget": name,
        "chart": widget.chart,
        "filters": filters,
        "rows": rows,
    }
