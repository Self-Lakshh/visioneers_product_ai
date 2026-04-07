"""
Schemas for the /analyze endpoint.

These are pure data-transfer objects (DTOs) — no business logic here.
Validation is handled by Pydantic; business logic lives in services/.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Literal


class AnalyzeRequest(BaseModel):
    """Payload sent by the client to request a product analysis."""

    url: HttpUrl = Field(
        ...,
        description="Public URL of the product page to analyze.",
        examples=["https://www.amazon.com/dp/B09XYZ"],
    )
    depth: Literal["quick", "standard", "deep"] = Field(
        default="standard",
        description="Analysis depth. 'quick' uses cached data; 'deep' triggers full pipeline.",
    )
    include_competitors: bool = Field(
        default=False,
        description="Whether to include competitor price/review comparison.",
    )

    model_config = {"str_strip_whitespace": True}


class AnalyzeResponse(BaseModel):
    """Response envelope for all analyze requests."""

    request_id: str = Field(..., description="Unique ID for tracing this request.")
    status: Literal["queued", "processing", "complete", "error"] = Field(
        ..., description="Current state of the analysis job."
    )
    message: str = Field(..., description="Human-readable status message.")
    data: dict | None = Field(
        default=None,
        description="Analysis result payload (null until status=complete).",
    )
