"""
Output schemas for the core intelligence pipeline.

Every field is typed and documented. The top-level AnalyzeResponse  
replaces the loose `data: dict | None` from the old stub schema.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Literal


# =============================================================================
# SUB-MODELS (nested inside AnalyzeResult)
# =============================================================================

class ProductSummary(BaseModel):
    """LLM-extracted product metadata."""
    name: str = Field(..., description="Product name.")
    brand: str = Field(..., description="Brand/manufacturer.")
    category: str = Field(..., description="Product category.")
    price_usd: float | None = Field(None, description="Detected price in USD.")
    key_features: list[str] = Field(
        default_factory=list,
        description="Top product features extracted by LLM.",
        max_length=10,
    )
    sentiment: Literal["positive", "neutral", "negative", "mixed"] = Field(
        ..., description="Overall review sentiment."
    )
    confidence_score: float = Field(default=0.9, ge=0.0, le=1.0, description="LLM confidence in extraction accuracy.")


class Competitor(BaseModel):
    """A single competitor product found via Tavily."""
    name: str
    url: str
    price_usd: float | None = None
    score: float = Field(..., ge=0.0, le=10.0, description="Decision Engine score 0–10.")
    strengths: list[str] = Field(default_factory=list, max_length=5)
    weaknesses: list[str] = Field(default_factory=list, max_length=5)
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0, description="LLM confidence this is a true competitor.")
    match_reasoning: str = Field(default="Algorithmic match.", description="Why this was chosen as a competitor.")


class ScoreBreakdown(BaseModel):
    """
    Weighted scoring dimensions from the Decision Engine.
    All scores are 0–10. Higher is better.
    Weights must be set so they always sum to 1.0 (enforced in DecisionEngine).
    """
    value_for_money:   float = Field(..., ge=0.0, le=10.0)
    feature_richness:  float = Field(..., ge=0.0, le=10.0)
    market_positioning: float = Field(..., ge=0.0, le=10.0)
    review_sentiment:  float = Field(..., ge=0.0, le=10.0)
    competitive_edge:  float = Field(..., ge=0.0, le=10.0)
    overall:           float = Field(..., ge=0.0, le=10.0, description="Weighted composite score.")


class TradeOff(BaseModel):
    """A single identified trade-off or risk factor."""
    dimension: str = Field(..., description="e.g. 'Price vs Features'")
    description: str
    severity: Literal["low", "medium", "high"]


class Recommendation(BaseModel):
    """Final actionable recommendation from the Decision Engine."""
    verdict: Literal["strong_buy", "buy", "hold", "avoid"] = Field(
        ..., description="Concise verdict label."
    )
    summary: str = Field(..., description="1–2 sentence rationale.")
    target_audience: str = Field(..., description="Who this product is best suited for.")
    alternatives: list[str] = Field(
        default_factory=list,
        max_length=3,
        description="Names of top alternative products (if competitors found).",
    )
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0, description="Engine/LLM combined confidence in verdict.")
    explainability_summary: str = Field(default="No explanation provided.", description="Plain English description of the recommendation derivation.")


# =============================================================================
# TOP-LEVEL OUTPUT
# =============================================================================

class AnalyzeResult(BaseModel):
    """
    Fully typed analysis result payload.
    This is the `data` field in the AnalyzeResponse envelope.
    """
    product: ProductSummary
    competitors: list[Competitor] = Field(default_factory=list)
    scores: ScoreBreakdown
    trade_offs: list[TradeOff] = Field(default_factory=list, max_length=8)
    recommendation: Recommendation
    explainability_log: list[str] = Field(default_factory=list, description="Step-by-step logic trace from the Decision Engine.")
    pipeline_meta: dict = Field(
        default_factory=dict,
        description="Internal metadata: model used, latency, cache hit, etc."
    )


class AnalyzeResponse(BaseModel):
    """Top-level API response envelope for POST /api/v1/analyze."""

    request_id: str = Field(..., description="Unique ID for distributed tracing.")
    status: Literal["complete", "error", "partial"] = Field(
        ..., description="complete = full result; partial = fallback used; error = failed."
    )
    message: str = Field(..., description="Human-readable status message.")
    data: AnalyzeResult | None = Field(
        default=None,
        description="Full result payload. Null only when status=error.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "request_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "status": "complete",
                "message": "Analysis complete.",
                "data": {
                    "product": {
                        "name": "SteelSeries Arctis Nova Pro Wireless",
                        "brand": "SteelSeries",
                        "category": "Gaming Headsets",
                        "price_usd": 349.99,
                        "key_features": ["ANC", "Multi-system connect", "Hot-swap battery"],
                        "sentiment": "positive",
                    },
                    "scores": {
                        "value_for_money": 6.5,
                        "feature_richness": 9.2,
                        "market_positioning": 8.4,
                        "review_sentiment": 8.8,
                        "competitive_edge": 7.9,
                        "overall": 8.16,
                    },
                    "recommendation": {
                        "verdict": "buy",
                        "summary": "Premium build and features justify the price for serious gamers.",
                        "target_audience": "PC/PS5 gamers seeking premium wireless audio with ANC.",
                        "alternatives": ["Sony INZONE H9", "Astro A50 X"],
                    },
                },
            }
        }
    }
