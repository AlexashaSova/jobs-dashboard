"""Завантаження SQL-файлів віджетів із sql/queries/.

Кожен файл називається NN_name.sql. Перший рядок-коментар — опис,
рядок "-- Віджет: ..." — підказка, яким графіком це малювати.
"""
import re
from dataclasses import dataclass
from functools import lru_cache

from .config import settings

FILENAME_RE = re.compile(r"^(\d+)_(.+)\.sql$")


@dataclass(frozen=True)
class Widget:
    name: str
    order: int
    description: str
    chart: str
    sql: str
    uses_filters: bool


def _parse_file(path) -> Widget | None:
    match = FILENAME_RE.match(path.name)
    if not match:
        return None

    order, name = int(match.group(1)), match.group(2)
    text = path.read_text(encoding="utf-8")

    description, chart = "", ""
    for line in text.splitlines():
        if not line.startswith("--"):
            break
        comment = line[2:].strip()
        if comment.startswith("Віджет:"):
            chart = comment.removeprefix("Віджет:").strip().rstrip(".")
        elif not description:
            description = comment

    # ClickHouse через HTTP не любить ";" у кінці
    sql = text.strip().rstrip(";")

    return Widget(
        name=name,
        order=order,
        description=description,
        chart=chart,
        sql=sql,
        uses_filters="{months:" in sql,
    )


@lru_cache
def load_widgets() -> dict[str, Widget]:
    widgets: dict[str, Widget] = {}
    for path in sorted(settings.queries_dir.glob("*.sql")):
        widget = _parse_file(path)
        if widget:
            widgets[widget.name] = widget
    return widgets
