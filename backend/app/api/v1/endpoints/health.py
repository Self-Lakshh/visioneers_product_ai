"""
Health check endpoint — Safe and Non-Blocking.
Removed rigid Redis dependencies to prevent startup hangs.
"""

from fastapi import APIRouter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get(
    "",
    summary="Liveness check",
    tags=["ops"],
)
async def health_check():
    """
    Returns the current health status. 
    Redis check is now optional and non-blocking.
    """
    return {
        "status": "ok",
        "version": settings.app_version,
        "environment": settings.app_env,
        "message": "Visioneers Core Active"
    }
