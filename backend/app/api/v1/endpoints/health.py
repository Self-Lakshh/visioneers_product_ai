from fastapi import APIRouter, Depends
from redis.asyncio import Redis

from app.core.redis import get_redis

router = APIRouter()


@router.get("/redis")
async def redis_health(redis: Redis = Depends(get_redis)) -> dict:
    """Verify Redis connectivity."""
    pong = await redis.ping()
    return {"redis": "ok" if pong else "error"}
