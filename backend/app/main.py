"""
Visioneers Product AI — High-Performance API Core.
Permanent Reliability Fix: Permissive CORS & No-Caching by default.
"""

import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.logging import get_logger, setup_logging
from app.api.v1.router import api_router

# Startup Logging
setup_logging(level=settings.log_level)
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

# ─── 🚀 PERMISSIVE CORS (Permanent Dev Solution) ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 📝 REQUEST LOGGING ───
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start = time.perf_counter()

    logger.info(f"INCOMING: {request.method} {request.url.path} (ID: {request_id})")

    response = await call_next(request)
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed}ms"

    logger.info(f"OUTGOING: {request.method} {request.url.path} {response.status_code} ({elapsed}ms)")
    return response

# ─── 🛠 GLOBAL EXCEPTION ───
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"CRITICAL ERROR: {exc}")
    return JSONResponse(status_code=500, content={"error": "internal_server_error", "message": str(exc)})

# ─── 🌲 ROUTERS ───
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["ops"])
async def root():
    return {"status": "active", "core": settings.app_name}
