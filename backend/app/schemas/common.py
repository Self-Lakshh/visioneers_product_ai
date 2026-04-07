"""
Common response schemas shared across multiple endpoints.
"""

from pydantic import BaseModel, Field
from typing import Any


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    version: str = Field(..., examples=["0.1.0"])
    environment: str = Field(..., examples=["development"])
    redis: str = Field(..., examples=["ok", "unavailable"])


class ErrorResponse(BaseModel):
    """Standard error envelope returned on 4xx/5xx responses."""

    error: str = Field(..., description="Machine-readable error code.")
    message: str = Field(..., description="Human-readable description.")
    detail: Any = Field(default=None, description="Optional debug detail.")
