"""
Intelligence Service — Production Grade Strategic Analysis.
Enhanced with Market Gaps, Strengths, and Strategic Key Moves.
"""

from __future__ import annotations
import json
import re
import asyncio
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Canonical model for Llama 3.1
GROQ_MODEL = "llama-3.1-8b-instant"
groq_client = AsyncGroq(api_key=settings.groq_api_key)

def extract_json(text: str) -> dict:
    if not text: return {}
    try:
        text = text.strip()
        if text.startswith("```json"): text = text[7:-3].strip()
        elif text.startswith("```"): text = text[3:-3].strip()
        return json.loads(text or "{}")
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try: return json.loads(match.group())
            except: return {}
        return {}

async def call_groq(prompt: str, timeout: float = 8.0) -> str:
    try:
        response = await asyncio.wait_for(
            groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Tier-1 Venture Capital Analyst. Return ONLY JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
            ),
            timeout=timeout
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"GROQ_SERVICE_ERROR: {str(e)}")
        return ""

class LLMService:
    async def generate_search_queries(self, idea: str) -> list[str]:
        prompt = f"""Generate 2 high-intent search queries to find direct competitors for: {idea}. 
Return JSON: {{"queries": []}}"""
        res = await call_groq(prompt)
        return extract_json(res).get("queries", [])[:2]

    async def generate_final_synthesis(self, idea: str, search_data: list[dict]) -> dict:
        """Enhanced Synthesis: Provides Strengths, Gaps, and Strategic Verdicts."""
        snippets = "\n".join([
            f"ID:{i} T:{s.get('title')} C:{s.get('content')[:200]}" 
            for i, s in enumerate(search_data[:3])
        ])
        
        prompt = f"""
Analyze the Product Idea: '{idea}' against these market benchmarks:
{snippets}

Return a Deep Intelligence JSON with exactly this structure:
{{
  "competitors": [
    {{
      "name": "...",
      "domain": "valid URL like https://...",
      "tagline": "Brief identity",
      "strengths": ["...", "..."],
      "market_gaps": ["...", "..."],
      "strategic_risk": "One sentence risk"
    }}
  ],
  "market_insight": {{
    "summary": "Full strategic summary",
    "key_gap": "The #1 opportunity found",
    "strategic_verdict": "buy | hold | avoid",
    "idea_score": 0.0 - 10.0,
    "key_moves": ["Move 1", "Move 2", "Move 3"],
    "alternative_paths": ["Path A", "Path B"]
  }}
}}
Limit competitors to top 3. Ensure valid URL in 'domain'.
"""
        res = await call_groq(prompt, timeout=12.0)
        return extract_json(res)
