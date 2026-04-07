"""
Decision Engine — Deterministic scoring and recommendation logic.

This module produces a reproducible ScoreBreakdown and Recommendation
from structured product + competitor data.

Scoring philosophy:
  - All scores are 0–10 (float, 1 decimal)
  - Weights are defined as class constants and always sum to 1.0
  - No LLM is used for scoring — pure algorithmic + rule-based logic
  - The same inputs always produce the same outputs (deterministic)

Score dimensions (weights):
  ┌─────────────────────────┬────────┐
  │ Dimension               │ Weight │
  ├─────────────────────────┼────────┤
  │ value_for_money         │  0.25  │
  │ feature_richness        │  0.20  │
  │ market_positioning      │  0.20  │
  │ review_sentiment        │  0.20  │
  │ competitive_edge        │  0.15  │
  └─────────────────────────┴────────┘
  Total                     │  1.00  │
"""

from __future__ import annotations

import statistics
from typing import Literal

from app.core.logging import get_logger
from app.schemas.output_schema import (
    Competitor,
    ProductSummary,
    Recommendation,
    ScoreBreakdown,
    TradeOff,
)

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Weight constants — MUST sum to 1.0
# ---------------------------------------------------------------------------
W_VALUE_FOR_MONEY    = 0.25
W_FEATURE_RICHNESS   = 0.20
W_MARKET_POSITIONING = 0.20
W_REVIEW_SENTIMENT   = 0.20
W_COMPETITIVE_EDGE   = 0.15

assert abs(
    W_VALUE_FOR_MONEY + W_FEATURE_RICHNESS + W_MARKET_POSITIONING
    + W_REVIEW_SENTIMENT + W_COMPETITIVE_EDGE - 1.0
) < 1e-9, "Scoring weights must sum to 1.0"


# ---------------------------------------------------------------------------
# Lookup tables
# ---------------------------------------------------------------------------
SENTIMENT_SCORES: dict[str, float] = {
    "positive": 9.0,
    "mixed":    6.5,
    "neutral":  5.0,
    "negative": 2.0,
}

VERDICT_THRESHOLDS: list[tuple[float, str]] = [
    (8.5, "strong_buy"),
    (7.0, "buy"),
    (5.5, "hold"),
    (0.0, "avoid"),
]


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
class DecisionEngine:
    """
    Pure-function scoring engine. No I/O, no LLM calls.
    All methods are deterministic given the same inputs.
    """

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------
    def score(
        self,
        product: ProductSummary,
        competitors: list[Competitor],
        trade_offs: list[TradeOff],
        explainability_log: list[str] | None = None,
    ) -> tuple[ScoreBreakdown, list[Competitor], list[str]]:
        """
        Compute scoring for the target product and all competitors.

        Args:
            product:     Extracted product data.
            competitors: Raw competitor list (price_usd may be None).
            trade_offs:  LLM-generated trade-off list (used for risk penalty).

        Returns:
            (ScoreBreakdown for target product, scored Competitor list)
        """
        explain_log = explainability_log if explainability_log is not None else []
        explain_log.append("Initialization: Scoring Engine Started.")
        
        # Score each dimension independently
        value   = self._score_value_for_money(product, competitors)
        feature = self._score_feature_richness(product)
        market  = self._score_market_positioning(product, competitors)
        sentiment = self._score_review_sentiment(product)
        edge    = self._score_competitive_edge(product, competitors)
        
        explain_log.append(f"Dimension Scores -> Value: {value}, Features: {feature}, Market: {market}, Sentiment: {sentiment}, Edge: {edge}")

        # Apply risk penalty from high-severity trade-offs
        high_severity = sum(1 for t in trade_offs if t.severity == "high")
        penalty = min(high_severity * 0.3, 1.5)   # max −1.5 points
        
        if penalty > 0:
            explain_log.append(f"Risk Penalty: -{penalty} points applied due to {high_severity} high-severity trade-offs.")

        raw_overall = (
            value   * W_VALUE_FOR_MONEY
            + feature * W_FEATURE_RICHNESS
            + market  * W_MARKET_POSITIONING
            + sentiment * W_REVIEW_SENTIMENT
            + edge    * W_COMPETITIVE_EDGE
        )
        overall = round(max(0.0, raw_overall - penalty), 2)
        explain_log.append(f"Overall Metric Derived: {overall}/10 (Raw: {round(raw_overall, 2)})")

        breakdown = ScoreBreakdown(
            value_for_money=round(value, 1),
            feature_richness=round(feature, 1),
            market_positioning=round(market, 1),
            review_sentiment=round(sentiment, 1),
            competitive_edge=round(edge, 1),
            overall=overall,
        )

        scored_competitors = self._score_competitors(competitors)
        explain_log.append(f"Competitor Engine: Ranked {len(scored_competitors)} verified alternatives weighted by LLM confidence scores.")

        logger.info(
            "Scoring complete",
            extra={
                "overall_score": overall,
                "penalty_applied": penalty,
                "competitor_count": len(scored_competitors),
            },
        )
        return breakdown, scored_competitors, explain_log

    def derive_recommendation(
        self,
        scores: ScoreBreakdown,
        product: ProductSummary,
        competitors: list[Competitor],
        llm_recommendation: Recommendation | None = None,
    ) -> Recommendation:
        """
        Derive a deterministic verdict from the score, then enrich with
        LLM-generated text fields (summary, target_audience) if available.
        The verdict is ALWAYS determined by the engine, never the LLM.

        Args:
            scores:              Output of score().
            product:             Product summary.
            competitors:         Scored competitors.
            llm_recommendation:  LLM-provided text (optional, for summary/audience).

        Returns:
            Final Recommendation with engine-determined verdict.
        """
        verdict = self._determine_verdict(scores.overall)

        # Top 3 competitors by scored value as alternatives
        sorted_comps = sorted(competitors, key=lambda c: c.score, reverse=True)
        alternatives = [c.name for c in sorted_comps[:3] if c.name != product.name]

        if llm_recommendation:
            summary          = llm_recommendation.summary
            target_audience  = llm_recommendation.target_audience
            confidence_score = llm_recommendation.confidence_score
            explainability_summary = llm_recommendation.explainability_summary
        else:
            summary         = self._generate_summary(verdict, product, scores)
            target_audience = f"Buyers looking for {product.category} within this price range."
            confidence_score = 0.5
            explainability_summary = "Generated heuristically as LLM inference was unavailable."

        return Recommendation(
            verdict=verdict,
            summary=summary,
            target_audience=target_audience,
            alternatives=alternatives,
            confidence_score=confidence_score,
            explainability_summary=explainability_summary,
        )

    # ------------------------------------------------------------------
    # Dimension scorers
    # ------------------------------------------------------------------
    def _score_value_for_money(
        self, product: ProductSummary, competitors: list[Competitor]
    ) -> float:
        """
        Compare product price against competitor median.
        - No price data → neutral 5.0
        - Below median → higher score (better value)
        - Above median → lower score
        """
        if product.price_usd is None:
            return 5.0

        competitor_prices = [
            c.price_usd for c in competitors if c.price_usd is not None
        ]
        if not competitor_prices:
            # No competitor prices — can't benchmark, return neutral
            return 5.0

        median_price = statistics.median(competitor_prices)
        if median_price == 0:
            return 5.0

        ratio = product.price_usd / median_price
        # ratio < 1 → cheaper than median → higher score
        # ratio > 1 → pricier than median → lower score
        # Clamped to [1, 10]
        raw = 10.0 - (ratio - 0.5) * 5.0
        return round(max(1.0, min(10.0, raw)), 1)

    def _score_feature_richness(self, product: ProductSummary) -> float:
        """
        Score based on number of extracted key features.
        0 features → 2.0,  10 features → 10.0 (linear).
        """
        count = len(product.key_features)
        return round(max(1.0, min(10.0, 2.0 + count * 0.8)), 1)

    def _score_market_positioning(
        self, product: ProductSummary, competitors: list[Competitor]
    ) -> float:
        """
        Score based on the product's relative price tier in the market.
        Luxury tier products get credit for premium positioning.
        No competitors → neutral 5.0
        """
        if not competitors or product.price_usd is None:
            return 5.0

        prices = [c.price_usd for c in competitors if c.price_usd is not None]
        if not prices:
            return 5.0

        min_p, max_p = min(prices), max(prices)
        price_range = max_p - min_p

        if price_range < 1:
            return 5.0

        # Position in the range (0=cheapest, 1=priciest)
        position = (product.price_usd - min_p) / price_range
        # Mid-market (0.3–0.7) scores best; extremes slightly penalized
        if 0.3 <= position <= 0.7:
            return 8.0
        elif position < 0.3:
            return 6.5   # Budget tier — decent but not premium
        else:
            return 7.0   # Premium tier — higher margin, acknowledged

    def _score_review_sentiment(self, product: ProductSummary) -> float:
        """Direct lookup from sentiment label → score."""
        return SENTIMENT_SCORES.get(product.sentiment, 5.0)

    def _score_competitive_edge(
        self, product: ProductSummary, competitors: list[Competitor]
    ) -> float:
        """
        Estimate competitive edge from feature count vs competitor count.
        No competitors → 7.0 (no competition data)
        Few competitors → higher edge; many competitors → lower edge.
        """
        n_comp = len(competitors)
        if n_comp == 0:
            return 7.0
        # Fewer competitors means less competition → stronger edge
        raw = 10.0 - (n_comp * 0.6)
        # Boost if product has more features than avg competitor feature count
        avg_comp_features = statistics.mean(
            [len(c.strengths) for c in competitors] or [0]
        )
        if len(product.key_features) > avg_comp_features:
            raw += 1.0
        return round(max(1.0, min(10.0, raw)), 1)

    # ------------------------------------------------------------------
    # Competitor scoring
    # ------------------------------------------------------------------
    def _score_competitors(self, competitors: list[Competitor]) -> list[Competitor]:
        """
        Assign a 0–10 score to each competitor based on a simple
        strength/weakness ratio. Purely data-driven.
        """
        scored = []
        for comp in competitors:
            n_strengths  = len(comp.strengths)
            n_weaknesses = len(comp.weaknesses)
            total = n_strengths + n_weaknesses
            if total == 0:
                base = 5.0
            else:
                base = (n_strengths / total) * 10.0
            
            # Refinement Logic: Weight base score by the LLM's confidence_score penalty 
            # (e.g. an 80% confident match gets slightly penalized on score logic)
            refined = base * max(0.5, comp.confidence_score)
            
            score = round(max(1.0, min(10.0, refined)), 1)
            scored.append(comp.model_copy(update={"score": score}))
        return sorted(scored, key=lambda c: c.score, reverse=True)

    # ------------------------------------------------------------------
    # Verdict
    # ------------------------------------------------------------------
    @staticmethod
    def _determine_verdict(overall: float) -> Literal["strong_buy", "buy", "hold", "avoid"]:
        for threshold, verdict in VERDICT_THRESHOLDS:
            if overall >= threshold:
                return verdict  # type: ignore[return-value]
        return "avoid"

    @staticmethod
    def _generate_summary(
        verdict: str, product: ProductSummary, scores: ScoreBreakdown
    ) -> str:
        templates = {
            "strong_buy": (
                f"{product.name} scores {scores.overall}/10 — exceptional across all dimensions. "
                f"Highly recommended."
            ),
            "buy":  (
                f"{product.name} scores {scores.overall}/10 — solid choice with good value "
                f"and feature set. Recommended."
            ),
            "hold": (
                f"{product.name} scores {scores.overall}/10 — adequate but with notable trade-offs. "
                f"Consider alternatives before purchasing."
            ),
            "avoid": (
                f"{product.name} scores {scores.overall}/10 — significant weaknesses outweigh benefits. "
                f"Not recommended at this time."
            ),
        }
        return templates.get(verdict, f"Score: {scores.overall}/10.")
