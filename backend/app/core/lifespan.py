"""
Simplified Application Lifespan.
Zero blocking startup. No Redis/Caching per user request.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from app.core.logging import get_logger

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("Visioneers Intelligence Core initialized (No Caching Mode)")
    
    yield  # Running
    
    # Shutdown
    logger.info("Visioneers Intelligence Core deactivated")
