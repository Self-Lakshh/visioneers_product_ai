"""
Visioneers Product AI — FastAPI application entry point.

Responsibilities:
  - App factory with lifespan (startup / shutdown)
  - Middleware registration (CORS, request-ID propagation)
  - Global exception handlers
  - Router mounting
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

# ---------------------------------------------------------------------------
# Logging — must be set up before any module-level loggers fire
# ---------------------------------------------------------------------------
setup_logging(
    level=settings.log_level,
    json_logs=settings.app_env != "development",
)

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered product intelligence platform.",
    docs_url="/docs"   if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    openapi_url="/openapi.json" if settings.app_env != "production" else None,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start = time.perf_counter()

    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else "unknown",
        },
    )

    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed_ms}ms"

    logger.info(
        "Request completed",
        extra={
            "request_id": request_id,
            "status_code": response.status_code,
            "duration_ms": elapsed_ms,
        },
    )
    return response


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Unhandled exception",
        extra={"path": request.url.path, "method": request.method},
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred.",
            "detail": None,
        },
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Root liveness (minimal, no deps)
# ---------------------------------------------------------------------------
@app.get("/", tags=["ops"], include_in_schema=False)
async def root() -> dict:
    return {"service": settings.app_name, "version": settings.app_version}
