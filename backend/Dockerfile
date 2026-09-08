# Етап 1: збираємо фронтенд
FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Етап 2: бекенд + зібраний фронтенд
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY sql/queries ./sql/queries
COPY --from=frontend /build/dist ./frontend/dist

ENV QUERIES_DIR=/app/sql/queries
ENV FRONTEND_DIST=/app/frontend/dist

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
