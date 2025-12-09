# ---------- Frontend build stage ----------
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Backend dependency build ----------
FROM python:3.13-slim AS backend-build
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential libheif-dev libde265-dev pkg-config && \
    rm -rf /var/lib/apt/lists/* && \
    ln -sf /usr/include/aarch64-linux-gnu/libheif /usr/include/libheif || true && \
    ln -sf /usr/include/x86_64-linux-gnu/libheif /usr/include/libheif || true

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r backend/requirements.txt

# ---------- Backend runtime ----------
FROM python:3.13-slim AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends libheif1 libde265-0 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /opt/venv /opt/venv
COPY backend backend
COPY --from=frontend-build /frontend/dist /app/frontend

RUN mkdir -p /app/backend/data /app/backend/uploads && \
    chown -R root:0 /app && \
    chmod -R g+rwX /app

ENV FRONTEND_DIST=/app/frontend \
    UPLOADS_DIR=/app/backend/uploads

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

