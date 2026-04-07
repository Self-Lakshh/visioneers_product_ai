"""
LLM Service — All OpenAI interactions for the intelligence pipeline.

Responsibilities:
  1. generate_search_queries()  — turn a product URL into targeted search queries
  2. extract_product_data()     — parse raw page content into structured ProductSummary
  3. extract_competitors()      — identify competitor names/URLs from search snippets
  4. reason_trade_offs()        — generate trade-off analysis from product + competitor data
  5. structure_json()           — generic helper to force LLM output into a typed schema

Design principles:
  - All calls are async
  - System prompts are strict and fact-grounding (no "imagine" / "assume")
  - Temperature 0 for deterministic, extractive tasks; 0.3 for generative tasks
  - Responses are validated through Pydantic before leaving this service
  - Raises LLMServiceError on any unrecoverable failure
"""

from __future__ import annotations

import json
import asyncio
from typing import Any

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.output_schema import (
    ProductSummary,
    Competitor,
    TradeOff,
    Recommendation,
)

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL   = "gpt-4o-mini"       # Fast + cheap; swap to gpt-4o for deep
TIMEOUT_SECS    = 30


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class LLMServiceError(Exception):
    """Raised when an LLM call fails unrecoverably."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
async def _chat(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.0,
    response_format: str | None = "json_object",
    client: httpx.AsyncClient | None = None,
) -> dict:
    """
    Raw async call to OpenAI Chat Completions.
    Returns the parsed JSON dict of the assistant message content.
    """
    if not settings.openai_api_key:
        raise LLMServiceError("OPENAI_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format == "json_object":
        payload["response_format"] = {"type": "json_object"}

    _client = client or httpx.AsyncClient(timeout=TIMEOUT_SECS)
    try:
        resp = await _client.post(OPENAI_CHAT_URL, headers=headers, json=payload)
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except httpx.HTTPStatusError as e:
        raise LLMServiceError(f"OpenAI HTTP error {e.response.status_code}: {e.response.text}") from e
    except (json.JSONDecodeError, KeyError) as e:
        raise LLMServiceError(f"Failed to parse LLM response: {e}") from e
    finally:
        if client is None:
            await _client.aclose()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class LLMService:
    """
    Stateless service. Instantiate once per pipeline run or as a singleton.
    Shares a single httpx.AsyncClient for connection reuse across calls.
    """

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=TIMEOUT_SECS)

    async def close(self) -> None:
        await self._client.aclose()

    # ------------------------------------------------------------------
    # 1. Generate search queries
    # ------------------------------------------------------------------
    async def generate_search_queries(
        self, url: str, product_name: str | None = None
    ) -> list[str]:
        """
        Generate 3–5 targeted web search queries for finding competitors
        and market context.

        Returns:
            List of search query strings. Guaranteed non-empty.
        """
        prompt_context = f"Product URL: {url}"
        if product_name:
            prompt_context += f"\nProduct name: {product_name}"

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a market research assistant. Given a product URL, "
                    "generate specific web search queries to find:\n"
                    "1. Competitor products in the same category\n"
                    "2. Price comparisons\n"
                    "3. User reviews and sentiment\n\n"
                    "Rules:\n"
                    "- Only generate queries grounded in the provided URL/product\n"
                    "- Do not invent product names\n"
                    "- Return JSON: {\"queries\": [\"...\", ...]}\n"
                    "- 3 to 5 queries maximum"
                ),
            },
            {"role": "user", "content": prompt_context},
        ]

        result = await _chat(messages, client=self._client)
        queries: list[str] = result.get("queries", [])
        if not queries:
            raise LLMServiceError("LLM returned no search queries.")
        logger.debug("Generated %d search queries", len(queries))
        return queries[:5]

    # ------------------------------------------------------------------
    # 2. Extract structured product data from page content
    # ------------------------------------------------------------------
    async def extract_product_data(
        self, url: str, page_content: str
    ) -> ProductSummary:
        """
        Parse raw page text into a structured ProductSummary.

        Args:
            url:          The product page URL (for context).
            page_content: Raw scraped/fetched text (max ~4000 tokens).

        Returns:
            Validated ProductSummary model.
        """
        content_snippet = page_content[:6000]  # stay well under context limit

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a product data extraction engine. "
                    "Extract ONLY information explicitly present in the provided text. "
                    "Do NOT invent, infer, or hallucinate any field. "
                    "If a field is not found, use null. "
                    "Return strict JSON matching this schema:\n"
                    "{\n"
                    '  "name": string,\n'
                    '  "brand": string,\n'
                    '  "category": string,\n'
                    '  "price_usd": number | null,\n'
                    '  "key_features": [string, ...],  // max 10\n'
                    '  "sentiment": "positive"|"neutral"|"negative"|"mixed",\n'
                    '  "confidence_score": number // 0.0 to 1.0\n'
                    "}"
                ),
            },
            {
                "role": "user",
                "content": f"Product URL: {url}\n\nPage content:\n{content_snippet}",
            },
        ]

        result = await _chat(messages, temperature=0.0, client=self._client)
        try:
            return ProductSummary(**result)
        except ValidationError as e:
            raise LLMServiceError(f"ProductSummary validation failed: {e}") from e

    # ------------------------------------------------------------------
    # 3. Extract competitors from search snippets
    # ------------------------------------------------------------------
    async def extract_competitors(
        self,
        product_name: str,
        search_snippets: list[dict],
        max_competitors: int = 5,
    ) -> list[dict]:
        """
        Identify competitor products from Tavily search result snippets.

        Args:
            product_name:    The target product's name (to exclude self-references).
            search_snippets: List of {title, url, content} dicts from Tavily.
            max_competitors: Hard cap on returned competitors.

        Returns:
            List of dicts: [{name, url, price_usd}] — unscored, raw.
            Scoring happens in DecisionEngine.
        """
        snippets_text = "\n---\n".join(
            f"Title: {s.get('title', '')}\nURL: {s.get('url', '')}\nSnippet: {s.get('content', '')[:400]}"
            for s in search_snippets[:15]
        )

        messages = [
            {
                "role": "system",
                "content": (
                    f"You are a competitive intelligence analyst. "
                    f"The target product is: '{product_name}'.\n"
                    "From the search snippets below, identify ONLY real competitor products "
                    "(not the same product, not accessories). "
                    "Extract only what is explicitly stated. No invented data.\n"
                    f"Return JSON: {{\"competitors\": ["
                    f"{{\"name\": string, \"url\": string, \"price_usd\": number|null, "
                    f"\"confidence_score\": number, \"match_reasoning\": string}}"
                    f"], ...}} — max {max_competitors} items."
                ),
            },
            {"role": "user", "content": snippets_text},
        ]

        result = await _chat(messages, temperature=0.0, client=self._client)
        competitors: list[dict] = result.get("competitors", [])
        logger.debug("Extracted %d raw competitors", len(competitors))
        return competitors[:max_competitors]

    # ------------------------------------------------------------------
    # 4. Reason trade-offs
    # ------------------------------------------------------------------
    async def reason_trade_offs(
        self,
        product: ProductSummary,
        competitors: list[Competitor],
    ) -> tuple[list[TradeOff], Recommendation]:
        """
        Generate a trade-off analysis and final recommendation.

        This is the only generative call (temperature 0.3).
        All reasoning must be grounded in the data passed in — no invention.

        Returns:
            (trade_offs, recommendation)
        """
        product_json  = product.model_dump_json(indent=2)
        competitor_json = json.dumps(
            [c.model_dump() for c in competitors], indent=2
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a senior product analyst. Given structured product data "
                    "and competitor data, produce:\n"
                    "1. A list of trade-offs (max 6): each with dimension, description, severity\n"
                    "2. A recommendation: verdict (strong_buy|buy|hold|avoid), summary, "
                    "target_audience, alternatives list\n\n"
                    "Rules:\n"
                    "- Base ALL reasoning strictly on the provided data\n"
                    "- Do NOT introduce external knowledge or invented facts\n"
                    "- Provide a confidence_score (0.0 to 1.0) and explainability_summary for recommendation\n"
                    "- Return JSON:\n"
                    '{"trade_offs": [{...}], "recommendation": {...}}'
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Product:\n{product_json}\n\n"
                    f"Competitors:\n{competitor_json}"
                ),
            },
        ]

        result = await _chat(messages, temperature=0.3, client=self._client)

        try:
            trade_offs = [TradeOff(**t) for t in result.get("trade_offs", [])]
            recommendation = Recommendation(**result["recommendation"])
        except (ValidationError, KeyError) as e:
            raise LLMServiceError(f"Trade-off/recommendation parse failed: {e}") from e

        return trade_offs, recommendation
