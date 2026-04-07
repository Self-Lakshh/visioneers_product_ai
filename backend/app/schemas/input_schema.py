"""
Input & Output schemas for the core intelligence pipeline.

All schemas use strict Pydantic v2 validation.
Input schema replaces the old AnalyzeRequest.
Output schema replaces the loose `dict | None` data field.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator
from typing import Literal, Annotated


# =============================================================================
# INPUT SCHEMA
# =============================================================================

class AnalyzeRequest(BaseModel):
    """
    Validated input for the POST /api/v1/analyze endpoint.
    Replaces the stub schema with full field validation.
    """

    url: HttpUrl = Field(
        ...,
        description="Public URL of the product page to analyze.",
        examples=["https://www.amazon.com/dp/B0CHWRXH8B"],
    )
    depth: Literal["quick", "standard", "deep"] = Field(
        default="standard",
        description=(
            "quick   → cache-only, no live search.\n"
            "standard → LLM + Tavily search.\n"
            "deep     → full pipeline + competitor deep-dive."
        ),
    )
    include_competitors: bool = Field(
        default=True,
        description="If True, triggers competitor search and benchmarking.",
    )
    max_competitors: Annotated[int, Field(ge=1, le=10)] = Field(
        default=5,
        description="Maximum number of competitors to fetch and analyze.",
    )
    language: str = Field(
        default="en",
        description="ISO 639-1 language code for LLM outputs.",
        pattern=r"^[a-z]{2}$",
    )

    model_config = {
        "str_strip_whitespace": True,
        "json_schema_extra": {
            "example": {
                "url": "https://www.amazon.com/dp/B0CHWRXH8B",
                "depth": "standard",
                "include_competitors": True,
                "max_competitors": 5,
                "language": "en",
            }
        },
    }
