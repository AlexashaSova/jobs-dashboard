"""Фільтри дашборду: як вони приходять з URL і як ідуть у ClickHouse.

Приклад URL:
  /api/widgets/kpi?months=2024-03&months=2024-04&levels=Entry%20level&has_desc=1

Однойменні параметри (months=...&months=...) FastAPI збирає у список.
"""
from fastapi import Query
from pydantic import BaseModel, Field


class Filters(BaseModel):
    months: list[str] = Field(default_factory=list)
    levels: list[str] = Field(default_factory=list)
    work_types: list[str] = Field(default_factory=list)
    has_desc: int = -1
    has_skills: int = -1

    def to_clickhouse(self) -> dict:
        """Назви ключів = назви параметрів у SQL: {months:Array(String)} і т.д."""
        return {
            "months": self.months,
            "levels": self.levels,
            "work_types": self.work_types,
            "has_desc": self.has_desc,
            "has_skills": self.has_skills,
        }


def filters_from_query(
    months: list[str] = Query(default=[], description="Місяці у форматі YYYY-MM"),
    levels: list[str] = Query(default=[], description="Рівні досвіду"),
    work_types: list[str] = Query(default=[], description="Типи зайнятості"),
    has_desc: int = Query(default=-1, ge=-1, le=1, description="-1 будь-які, 1 з описом, 0 без"),
    has_skills: int = Query(default=-1, ge=-1, le=1, description="-1 будь-які, 1 з вимогами, 0 без"),
) -> Filters:
    return Filters(
        months=months,
        levels=levels,
        work_types=work_types,
        has_desc=has_desc,
        has_skills=has_skills,
    )
