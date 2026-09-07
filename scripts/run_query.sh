#!/usr/bin/env bash
# Запускає запит із sql/queries/ з фільтрами.
#
# Без фільтрів (усі дані):
#   ./scripts/run_query.sh kpi
#
# З фільтрами (порядок: місяці, рівні, типи, є_опис, є_вимоги):
#   ./scripts/run_query.sh kpi "['2024-03','2024-04']" "['Entry level']" "[]" 1 -1
#
# Порожній масив [] = не фільтрувати. Для має_опис / має_вимоги:
#   -1 = будь-які, 1 = тільки з описом, 0 = тільки без.
set -e

NAME="$1"
MONTHS="${2:-[]}"
LEVELS="${3:-[]}"
TYPES="${4:-[]}"
HAS_DESC="${5:--1}"
HAS_SKILLS="${6:--1}"

if [ -z "$NAME" ]; then
  echo "Використання: ./scripts/run_query.sh <назва> [months] [levels] [types] [has_desc] [has_skills]"
  echo "Доступні запити:"
  ls sql/queries | sed 's/^[0-9]*_//; s/\.sql$//' | sed 's/^/  /'
  exit 1
fi

FILE=$(ls sql/queries/*_"$NAME".sql 2>/dev/null | head -1)
if [ -z "$FILE" ]; then
  echo "Не знайдено запит '$NAME' у sql/queries/"
  exit 1
fi

docker compose exec -T clickhouse clickhouse-client \
  -u "${CH_USER:-dash}" --password "${CH_PASSWORD:-dash}" \
  --param_months="$MONTHS" \
  --param_levels="$LEVELS" \
  --param_work_types="$TYPES" \
  --param_has_desc="$HAS_DESC" \
  --param_has_skills="$HAS_SKILLS" \
  --format PrettyCompact < "$FILE"
