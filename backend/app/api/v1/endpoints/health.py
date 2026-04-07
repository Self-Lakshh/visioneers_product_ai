"""
Health check endpoint — verifies liveness and dependency connectivity.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger
from app.core.redis import get_redis
from app.schemas.common import HealthResponse
from app.utils.dependencies import RedisDep

logger = get_logger(__name__)
router = APIRouter()


@router.get(
    "",
    response_model=HealthResponse,
    summary="Liveness & dependency health check",
    tags=["ops"],
)
async def health_check(redis: RedisDep) -> HealthResponse:
    """
    Returns the current health status of the API and its dependencies.

    - **status**: always `ok` if this endpoint responds
    - **redis**: `ok` if Redis is pingable, otherwise `unavailable`
    """
    redis_status = "unavailable"
    try:
        pong = await redis.ping()
        redis_status = "ok" if pong else "unavailable"
    except Exception as exc:
        logger.warning("Redis health check failed: %s", exc)

    response = HealthResponse(
        status="ok",
        version=settings.app_version,
        environment=settings.app_env,
        redis=redis_status,
    )
    status_code = 200 if redis_status == "ok" else 207
    return JSONResponse(content=response.model_dump(), status_code=status_code)
