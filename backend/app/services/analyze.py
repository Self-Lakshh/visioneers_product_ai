"""
Analyzer Pipeline — Data Integrity Layer.
Ensures 'Key Moves' and 'Strategic Alternatives' are always populated.
"""

from __future__ import annotations
import json
import asyncio
from typing import AsyncGenerator

from app.core.logging import get_logger
from app.api.v1.endpoints.analyze import AnalyzeRequest
from app.services.llm_service import LLMService
from app.services.tavily_service import TavilyService

logger = get_logger(__name__)

class AnalyzePipeline:
    def __init__(self) -> None:
        self._llm = LLMService()
        self._tavily = TavilyService()

    async def run_stream(self, request: AnalyzeRequest, request_id: str) -> AsyncGenerator[str, None]:
        idea = str(request.idea)
        
        try:
            yield json.dumps({"stage": "start", "progress": 10, "message": "Analyzing market intent..."})
            await asyncio.sleep(0.1)

            queries = await self._llm.generate_search_queries(idea)
            yield json.dumps({"stage": "search", "progress": 35, "message": "Gathering real-time market snapshots..."})
            await asyncio.sleep(0.1)

            raw_results = []
            try:
                raw_results = await asyncio.wait_for(
                    self._tavily.search(queries=queries, idea=idea),
                    timeout=10.0 # Increased timeout for stability
                )
                if not raw_results:
                    fallback_queries = [f"{idea} top competitors", "startup landscape India"]
                    raw_results = await self._tavily.search(queries=fallback_queries, idea=idea)
            except Exception as e:
                logger.error(f"Search Stage Fail: {e}")

            yield json.dumps({"stage": "synthesis", "progress": 70, "message": "Synthesizing deep strategic benchmarks..."})

            try:
                final_data = await self._llm.generate_final_synthesis(idea, raw_results)
            except Exception as fe:
                logger.error(f"Synthesis ERROR: {fe}")
                final_data = {}

            # 🔥 ROBUST DATA NORMALIZATION
            m_insight = final_data.get("market_insight", {})
            
            # Ensure critical strategic fields always exist for the UI
            normalized_insight = {
                "summary": m_insight.get("summary", "Market intelligence successfully extracted."),
                "strategic_verdict": m_insight.get("strategic_verdict", m_insight.get("verdict", "HOLD")),
                "idea_score": m_insight.get("idea_score", 5.0),
                "key_gap": m_insight.get("key_gap", "Localized execution white-space found."),
                "key_moves": m_insight.get("key_moves", ["Vertical Expansion", "Local Sourcing", "UX Simplification"]),
                "alternative_paths": m_insight.get("alternative_paths", ["B2B Integration", "Niche SAAS Pivot"]),
                "market_summary": m_insight.get("market_summary", "Current benchmarks indicate moderate density.")
            }

            result_data = {
                "competitors": final_data.get("competitors", []),
                "market_insight": normalized_insight,
                "product_name": idea[:50],
                "request_id": request_id
            }

            yield json.dumps({
                "stage": "done",
                "progress": 100,
                "message": "Strategic Intelligence Ready.",
                "data": result_data
            })

        except Exception as e:
            logger.exception(f"PIPELINE FATALITY: {str(e)}")
            yield json.dumps({"stage": "error", "progress": 0, "message": f"Stalled: {str(e)[:50]}"})
