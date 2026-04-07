# Visioneers Product AI

> AI-powered product intelligence platform — monorepo edition.

---

## Project Structure

```
visioneers_product_ai/
├── .env.example          # Central environment variable template
├── .gitignore
├── docker-compose.yml    # Orchestrates backend + frontend + redis
│
├── backend/              # FastAPI service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── app/
│       ├── main.py       # App entrypoint, CORS, routers
│       ├── core/
│       │   ├── config.py # Pydantic Settings (env-driven, no hardcoded secrets)
│       │   └── redis.py  # Async Redis client
│       └── api/v1/
│           ├── router.py
│           └── endpoints/
│               └── health.py
│
└── frontend/             # Vite + React + TypeScript
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── nginx.conf        # Production static serving
    ├── .env.example      # Frontend-specific VITE_* vars only
    └── src/
        └── vite-env.d.ts # Type-safe import.meta.env
```

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/your-org/visioneers_product_ai.git
cd visioneers_product_ai

# Copy and fill in secrets
cp .env.example .env
```

> **Required fields in `.env`:** `SECRET_KEY`, `JWT_SECRET`, `POSTGRES_PASSWORD`

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |
| Redis    | localhost:6379             |

### 3. Run locally (without Docker)

#### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env             # Set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## Environment Strategy

| Variable prefix | Scope    | Committed? |
|----------------|----------|------------|
| `VITE_*`       | Frontend (browser) | `.env.example` only |
| Everything else | Backend / Docker only | `.env.example` only |

- Secrets live **only** in `.env` (gitignored)
- `.env.example` is the single source of truth for variable names
- Backend uses **Pydantic Settings** — fails loudly if required vars are missing
- Frontend uses **`import.meta.env`** — only `VITE_` prefixed vars are bundled

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python 3.12, FastAPI, Uvicorn       |
| Frontend  | React 18, TypeScript, Vite 5        |
| Cache     | Redis 7                             |
| Container | Docker, Docker Compose              |

---

## Development Workflow

```bash
# Hot-reload both services
docker compose up

# Run backend linter
cd backend && ruff check app/

# Run frontend type-check
cd frontend && npm run type-check

# Rebuild a single service
docker compose up --build backend
```