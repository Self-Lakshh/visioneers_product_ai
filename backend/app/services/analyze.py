"""
Pipeline Orchestrator — wires LLMService → TavilyService → DecisionEngine.

Flow:
  ① Fetch product page content (Tavily extract)
  ② Extract structured product data (LLM) — parallel with ①
  ③ Generate search queries (LLM)
  ④ Search competitors (Tavily) — parallel queries
  ⑤ Extract competitor entities from results (LLM) + score with Competitor stubs
  ⑥ Reason trade-offs + generate recommendation text (LLM)
     — parallel with competitor scoring (DecisionEngine)
  ⑦ Derive deterministic verdict (DecisionEngine)
  ⑧ Build & return AnalyzeResult

Cache strategy:
  - Cache key = SHA-256(url + depth + include_competitors)
  - TTL: quick=300s, standard=600s, deep=1800s
  - On cache hit: return cached AnalyzeResult directly (skip all I/O)
  - On LLM/Tavily failure: return partial/fallback result, never crash
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import time
import uuid
from typing import Any

from app.core.logging import get_logger
from app.core.redis import get_redis
from app.schemas.input_schema import AnalyzeRequest
from app.schemas.output_schema import (
    AnalyzeResponse,
    AnalyzeResult,
    Competitor,
    ProductSummary,
    Recommendation,
    ScoreBreakdown,
    TradeOff,
)
from app.services.decision_engine import DecisionEngine
from app.services.llm_service import LLMService, LLMServiceError
from app.services.tavily_service import TavilyService, TavilyServiceError

logger = get_logger(__name__)

CACHE_TTL: dict[str, int] = {
    "quick":    300,
    "standard": 600,
    "deep":     1800,
}


# ---------------------------------------------------------------------------
# Fallback helpers — never raises
# ---------------------------------------------------------------------------
def _fallback_product(url: str) -> ProductSummary:
    return ProductSummary(
        name="Unknown Product",
        brand="Unknown",
        category="Uncategorized",
        price_usd=None,
        key_features=[],
        sentiment="neutral",
    )


def _fallback_scores() -> ScoreBreakdown:
    return ScoreBreakdown(
        value_for_money=5.0,
        feature_richness=5.0,
        market_positioning=5.0,
        review_sentiment=5.0,
        competitive_edge=5.0,
        overall=5.0,
    )


def _fallback_recommendation(product: ProductSummary) -> Recommendation:
    return Recommendation(
        verdict="hold",
        summary=f"Insufficient data to fully analyze {product.name}. Manual review recommended.",
        target_audience="Unable to determine from available data.",
        alternatives=[],
    )


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------
class AnalyzePipeline:
    """
    Stateless pipeline orchestrator.
    Instantiate once per request; all services are created fresh.
    """

    def __init__(self) -> None:
        self._llm    = LLMService()
        self._tavily = TavilyService()
        self._engine = DecisionEngine()

    async def _close(self) -> None:
        await asyncio.gather(
            self._llm.close(),
            self._tavily.close(),
            return_exceptions=True,
        )

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------
    async def run(
        self, request: AnalyzeRequest, request_id: str
    ) -> AnalyzeResponse:
        start_ms = int(time.perf_counter() * 1000)
        url = str(request.url)
        cache_key = self._cache_key(request)

        # ── ① Cache check ────────────────────────────────────────────
        if request.depth != "deep":   # deep bypasses cache intentionally
            cached = await self._get_cache(cache_key)
            if cached:
                logger.info("Cache hit", extra={"request_id": request_id, "key": cache_key})
                return AnalyzeResponse(
                    request_id=request_id,
                    status="complete",
                    message="Analysis complete (cached).",
                    data=AnalyzeResult(**cached),
                )

        partial_mode = False
        product: ProductSummary
        trade_offs: list[TradeOff] = []
        competitors: list[Competitor] = []
        llm_rec: Recommendation | None = None

        try:
            # ── ② Fetch content + generate queries in parallel ───────
            fetch_task  = asyncio.create_task(self._tavily.fetch_content(url))
            queries_task = asyncio.create_task(
                self._llm.generate_search_queries(url)
            )
            page_content, queries = await asyncio.gather(
                fetch_task, queries_task, return_exceptions=False
            )

            # ── ③ Extract product data ────────────────────────────────
            product = await self._llm.extract_product_data(url, page_content)

        except (LLMServiceError, TavilyServiceError, Exception) as e:
            logger.error("Pipeline failed at extraction stage: %s", e,
                         extra={"request_id": request_id})
            product = _fallback_product(url)
            queries = []
            partial_mode = True

        # ── ④ Competitor search (skip if quick or failed) ───────────
        raw_competitor_dicts: list[dict] = []
        if request.include_competitors and queries and request.depth in ("standard", "deep"):
            try:
                search_depth = "advanced" if request.depth == "deep" else "basic"
                search_results = await self._tavily.search(
                    queries, search_depth=search_depth
                )
                raw_competitor_dicts = await self._llm.extract_competitors(
                    product.name, search_results, request.max_competitors
                )
            except Exception as e:
                logger.warning("Competitor extraction failed: %s", e,
                               extra={"request_id": request_id})
                partial_mode = True

        # Build Competitor stubs (unscored — engine will score)
        competitor_stubs = [
            Competitor(
                name=c.get("name", "Unknown"),
                url=c.get("url", ""),
                price_usd=c.get("price_usd"),
                score=5.0,         # placeholder; engine overwrites
                strengths=[],
                weaknesses=[],
            )
            for c in raw_competitor_dicts
        ]

        # ── ⑤ Score + trade-offs in parallel ─────────────────────────
        try:
            scores_task    = asyncio.create_task(
                asyncio.to_thread(
                    self._engine.score, product, competitor_stubs, []
                )
            )
            tradeoff_task  = asyncio.create_task(
                self._llm.reason_trade_offs(product, competitor_stubs)
            )
            (scores, scored_competitors, explain_log), (trade_offs, llm_rec) = await asyncio.gather(
                scores_task, tradeoff_task
            )
        except Exception as e:
            logger.error("Scoring/trade-off stage failed: %s", e,
                         extra={"request_id": request_id})
            scores = _fallback_scores()
            scored_competitors = competitor_stubs
            explain_log = ["Scoring failed critically. Default heuristic weights applied."]
            partial_mode = True

        # Re-score with trade-offs factored in
        if not partial_mode and trade_offs:
            try:
                scores, scored_competitors, explain_log = self._engine.score(
                    product, scored_competitors, trade_offs, explainability_log=explain_log
                )
            except Exception as e:
                logger.warning("Re-scoring with trade-offs failed: %s", e)

        # ── ⑥ Deterministic verdict ───────────────────────────────────
        recommendation = self._engine.derive_recommendation(
            scores, product, scored_competitors, llm_rec
        )

        # ── ⑦ Assemble result ─────────────────────────────────────────
        elapsed_ms = int(time.perf_counter() * 1000) - start_ms
        result = AnalyzeResult(
            product=product,
            competitors=scored_competitors,
            scores=scores,
            trade_offs=trade_offs,
            recommendation=recommendation,
            explainability_log=explain_log,
            pipeline_meta={
                "request_id":    request_id,
                "duration_ms":   elapsed_ms,
                "depth":         request.depth,
                "cache_key":     cache_key,
                "partial_mode":  partial_mode,
                "competitor_count": len(scored_competitors),
                "optimization_layers": ["explainability", "confidence_scoring", "ranking_refinement"]
            },
        )

        # ── ⑧ Cache result ────────────────────────────────────────────
        if not partial_mode and request.depth != "deep":
            await self._set_cache(cache_key, result, ttl=CACHE_TTL[request.depth])

        await self._close()

        status = "partial" if partial_mode else "complete"
        message = (
            "Analysis complete."
            if not partial_mode
            else "Analysis complete with partial data (some sources failed)."
        )
        return AnalyzeResponse(
            request_id=request_id,
            status=status,
            message=message,
            data=result,
        )

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _cache_key(request: AnalyzeRequest) -> str:
        raw = f"{request.url}:{request.depth}:{request.include_competitors}"
        return "analyze:" + hashlib.sha256(raw.encode()).hexdigest()[:24]

    async def _get_cache(self, key: str) -> dict | None:
        try:
            redis = await get_redis()
            val = await redis.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.debug("Cache get failed: %s", e)
        return None

    async def _set_cache(self, key: str, result: AnalyzeResult, ttl: int) -> None:
        try:
            redis = await get_redis()
            await redis.setex(key, ttl, result.model_dump_json())
        except Exception as e:
            logger.debug("Cache set failed: %s", e)
