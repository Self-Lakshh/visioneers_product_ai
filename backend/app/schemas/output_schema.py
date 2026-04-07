"""
Simplified Output schemas for the UI-centric intelligence pipeline.
Focused on human-readable insights for non-technical users.
"""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal

class CompetitorEntry(BaseModel):
    """Simplified competitor card data."""
    name: str = Field(..., description="Competitor name (e.g. Zomato)")
    domain: str = Field(..., description="Clean domain without protocol (e.g. zomato.com)")
    tagline: str = Field(..., description="Short catchy description")
    delivery_claim: str = Field(..., description="e.g. '10 min delivery' or 'Free shipping'")
    key_features: list[str] = Field(default_factory=list, max_length=5)
    strengths: list[str] = Field(default_factory=list, max_length=3)
    weaknesses: list[str] = Field(default_factory=list, max_length=3)
    url: str = Field("", description="Primary website or app store link")
    price_usd: float | None = Field(None, description="Average price point if detectable")

class MarketInsight(BaseModel):
    """High-level strategic summary for the user."""
    summary: str = Field(..., description="Human-readable overview of the current space.")
    key_gap: str = Field(..., description="The single biggest opportunity for the user's idea.")
    recommendation: str = Field(..., description="Direct advice (e.g. 'Focus on local vendors')")
    idea_score: float = Field(..., ge=0.0, le=10.0, description="Match score from 0.0 to 10.0")
    verdict: str = Field("buy", description="Verdict: strong_buy | buy | hold | avoid")
    target_audience: str = Field("", description="Who this is for")
    alternatives: list[str] = Field(default_factory=list)
    explainability_summary: str = Field("", description="Plain English derivation")

class AnalyzeResult(BaseModel):
    """The simplified core data for the frontend."""
    competitors: list[CompetitorEntry] = Field(default_factory=list, max_length=3)
    market_insight: MarketInsight
    # Product summary kept for backward compatibility and internal context
    product_name: str = ""

class AnalyzeResponse(BaseModel):
    """Top-level API response envelope."""
    request_id: str
    status: Literal["complete", "error", "partial"]
    message: str
    data: AnalyzeResult | None = None
