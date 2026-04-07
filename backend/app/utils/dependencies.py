"""
Reusable FastAPI dependencies.

Import and use with `Depends(...)` in route functions.
"""

import time
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from redis.asyncio import Redis

from app.core.logging import get_logger
from app.core.redis import get_redis

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Redis Dependency
# ---------------------------------------------------------------------------

async def redis_dep() -> Redis:
    """Yield the shared async Redis client."""
    return await get_redis()


RedisDep = Annotated[Redis, Depends(redis_dep)]


# ---------------------------------------------------------------------------
# Request ID
# ---------------------------------------------------------------------------

async def request_id_dep(
    x_request_id: Annotated[str | None, Header()] = None,
) -> str:
    """
    Extract X-Request-ID from request headers, or generate one.
    Attach it to the response for distributed tracing.
    """
    import uuid
    return x_request_id or str(uuid.uuid4())


RequestIdDep = Annotated[str, Depends(request_id_dep)]


# ---------------------------------------------------------------------------
# Request Timing (for perf logging)
# ---------------------------------------------------------------------------

class TimingMiddleware:
    """Simple callable that records request start time."""

    async def __call__(self, request: Request) -> float:
        start = time.perf_counter()
        return start
