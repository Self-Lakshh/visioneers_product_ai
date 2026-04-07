"""
Tavily Service — Web search and content fetching via the Tavily API.

Responsibilities:
  1. search()       — run multiple queries in parallel, return ranked results
  2. fetch_content() — fetch full page content for a given URL
  3. deduplicate()   — remove duplicate results by URL/domain

Tavily API docs: https://docs.tavily.com/docs/tavily-api/rest_api

Design principles:
  - All calls are async
  - Parallel query execution via asyncio.gather
  - Deduplication by normalized URL and domain
  - Raises TavilyServiceError on unrecoverable failures
  - Gracefully skips failed individual queries (partial results > no results)
"""

from __future__ import annotations

import asyncio
import hashlib
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

TAVILY_SEARCH_URL  = "https://api.tavily.com/search"
TAVILY_EXTRACT_URL = "https://api.tavily.com/extract"
TIMEOUT_SECS       = 20
MAX_RESULTS_PER_Q  = 5


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class TavilyServiceError(Exception):
    """Raised when the Tavily API fails unrecoverably."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/").lower()


def _domain(url: str) -> str:
    return urlparse(url).netloc.lower().replace("www.", "")


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class TavilyService:
    """
    Stateless async Tavily client.
    Shares a single httpx.AsyncClient for connection reuse.
    """

    def __init__(self) -> None:
        if not settings.tavily_api_key:
            raise TavilyServiceError("TAVILY_API_KEY is not configured.")
        self._client = httpx.AsyncClient(
            timeout=TIMEOUT_SECS,
            headers={"Content-Type": "application/json"},
        )

    async def close(self) -> None:
        await self._client.aclose()

    # ------------------------------------------------------------------
    # 1. Parallel search
    # ------------------------------------------------------------------
    async def search(
        self,
        queries: list[str],
        search_depth: str = "basic",     # "basic" | "advanced"
        max_results: int = MAX_RESULTS_PER_Q,
    ) -> list[dict]:
        """
        Execute multiple search queries in parallel.

        Args:
            queries:      List of search query strings (from LLMService).
            search_depth: "basic" for speed, "advanced" for richer snippets.
            max_results:  Results per query before deduplication.

        Returns:
            Deduplicated, ranked list of search result dicts:
            [{title, url, content, score, published_date?}, ...]
        """
        tasks = [
            self._single_search(q, search_depth, max_results)
            for q in queries
        ]
        all_results_nested = await asyncio.gather(*tasks, return_exceptions=True)

        merged: list[dict] = []
        for i, result in enumerate(all_results_nested):
            if isinstance(result, Exception):
                logger.warning(
                    "Tavily query %d failed: %s", i, result,
                    extra={"query": queries[i]},
                )
                continue
            merged.extend(result)  # type: ignore[arg-type]

        deduped = self.deduplicate(merged)
        logger.info("Tavily search: %d raw → %d deduped results", len(merged), len(deduped))
        return deduped

    async def _single_search(
        self, query: str, search_depth: str, max_results: int
    ) -> list[dict]:
        """Run a single Tavily search query."""
        payload = {
            "api_key": settings.tavily_api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_answer": False,
            "include_raw_content": False,
        }
        resp = await self._client.post(TAVILY_SEARCH_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])

    # ------------------------------------------------------------------
    # 2. Fetch full page content
    # ------------------------------------------------------------------
    async def fetch_content(self, url: str) -> str:
        """
        Fetch and extract meaningful text content from a URL using Tavily Extract.

        Falls back to an empty string on failure rather than raising,
        so the pipeline can continue with partial data.
        """
        try:
            payload = {
                "api_key": settings.tavily_api_key,
                "urls": [url],
            }
            resp = await self._client.post(TAVILY_EXTRACT_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if results:
                return results[0].get("raw_content", "")
        except Exception as e:
            logger.warning("Tavily fetch failed for %s: %s", url, e)
        return ""

    # ------------------------------------------------------------------
    # 3. Deduplication
    # ------------------------------------------------------------------
    @staticmethod
    def deduplicate(results: list[dict]) -> list[dict]:
        """
        Remove duplicate search results.

        Deduplication strategy (in priority order):
          1. Exact normalized URL match
          2. Same domain + similar title hash (prevents near-duplicates)

        Returns results sorted by Tavily relevance score (descending).
        """
        seen_urls: set[str] = set()
        seen_domain_titles: set[str] = set()
        deduped: list[dict] = []

        # Sort by score descending so highest-quality result wins on collision
        sorted_results = sorted(results, key=lambda r: r.get("score", 0), reverse=True)

        for item in sorted_results:
            url  = item.get("url", "")
            norm = _normalize_url(url)
            domain = _domain(url)
            title_hash = hashlib.md5(item.get("title", "").lower().encode()).hexdigest()[:8]
            domain_title_key = f"{domain}:{title_hash}"

            if norm in seen_urls or domain_title_key in seen_domain_titles:
                continue

            seen_urls.add(norm)
            seen_domain_titles.add(domain_title_key)
            deduped.append(item)

        return deduped
