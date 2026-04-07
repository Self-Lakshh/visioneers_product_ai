"""
Application lifespan — startup and shutdown events.
Handles Redis connection pooling and any other shared resources.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from app.core.logging import get_logger
from app.core.redis import close_redis, get_redis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ---- Startup ----
    logger.info("Starting Visioneers Product AI backend...")

    # Warm up Redis connection pool
    try:
        redis = await get_redis()
        await redis.ping()
        logger.info("Redis connection established")
    except Exception as exc:
        logger.warning("Redis not available at startup: %s", exc)

    yield  # App is running

    # ---- Shutdown ----
    logger.info("Shutting down backend...")
    await close_redis()
    logger.info("Redis connection closed")
