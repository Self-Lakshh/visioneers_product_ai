"""
Input & Output schemas — Refined for resilience.
Relaxed regex to allow brand-name searches without 422 errors.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Literal
import re

class AnalyzeRequest(BaseModel):
    """
    Validated input for the POST /api/v1/analyze endpoint.
    Accepts natural language product ideas to process.
    """

    idea: str = Field(
        ...,
        min_length=3,
        description="Product idea description.",
        examples=["A smart water bottle that tracks intake"],
    )
    depth: Literal["quick", "standard", "deep"] = Field(default="standard")
    include_competitors: bool = Field(default=True)
    max_competitors: int = Field(default=3, ge=1, le=5)
    
    @field_validator("idea")
    def block_links(cls, v: str) -> str:
        # Only block actual URIs (https://) and 'www.' to avoid false-positives on brand names
        if re.search(r'(https?://|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{5,})', v):
            raise ValueError("Only descriptive product ideas allowed (no links)")
        return v

    model_config = {
        "str_strip_whitespace": True,
        "json_schema_extra": {
            "example": {
                "idea": "An AI coach for local athletes",
                "depth": "standard",
                "include_competitors": True,
                "max_competitors": 3
            }
        },
    }
