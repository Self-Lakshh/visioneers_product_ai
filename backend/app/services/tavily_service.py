"""
Tavily Service — Reliability Optimized for Production.
Strict sanitization and payload validation to prevent 400 Bad Request errors.
"""

from __future__ import annotations
import asyncio
import httpx
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

def clean_query(q: str, idea: str = "") -> str:
    """Sanitize and validate search queries for Tavily API."""
    q = q.strip().replace("\n", " ")[:200]
    
    # Reject if too short or likely a hallucination
    if len(q.split()) < 2 or not q:
        logger.warning(f"Invalid query detected: '{q}'. Using fallback.")
        return f"top {idea} competitors and alternatives India"
    
    return q

class TavilyService:
    def __init__(self) -> None:
        self.api_key = settings.tavily_api_key

    async def search(self, queries: list[str], idea: str = "") -> list[dict]:
        """
        Execute searches with strict payload control and parallelization.
        """
        if not self.api_key:
            logger.error("TAVILY_API_KEY is missing from environment.")
            return []

        # Sanitize and limit queries
        clean_queries = [clean_query(q, idea) for q in queries[:2]]
        
        results = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [self._single_call(client, q) for q in clean_queries]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for resp in responses:
                if isinstance(resp, list):
                    results.extend(resp)
                elif isinstance(resp, Exception):
                    logger.error(f"Tavily Async Task Failure: {resp}")
        
        return results[:3] # Limit final results for performance

    async def _single_call(self, client: httpx.AsyncClient, query: str) -> list[dict]:
        """Performs a single validated Tavily POST request."""
        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 5,
            "include_answer": False,
            "include_raw_content": False,
            "include_images": False
        }
        
        logger.info(f"TAVILY PAYLOAD: {query}")
        
        try:
            r = await client.post("https://api.tavily.com/search", json=payload)
            if r.status_code != 200:
                logger.error(f"TAVILY ERROR [{r.status_code}]: {r.text}")
                return []
            
            data = r.json()
            return data.get("results", [])
        except Exception as e:
            logger.error(f"TAVILY NETWORKING ERROR [{query}]: {str(e)}")
            return []
