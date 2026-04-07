"""
POST /api/v1/analyze

Thin HTTP layer — all intelligence lives in AnalyzePipeline.
Handles request validation, tracing, and error boundary.
"""

import uuid

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.logging import get_logger
from app.schemas.input_schema import AnalyzeRequest
from app.schemas.output_schema import AnalyzeResponse
from app.services.analyze import AnalyzePipeline
from app.utils.dependencies import RequestIdDep

logger = get_logger(__name__)
router = APIRouter()


@router.post(
    "",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a product URL with AI intelligence pipeline",
    response_description="Full product analysis with scores, competitors, and recommendation.",
    tags=["analyze"],
)
async def analyze_product(
    payload: AnalyzeRequest,
    request_id: RequestIdDep,
) -> AnalyzeResponse:
    """
    Runs the full intelligence pipeline:

    1. **Fetch** product page content via Tavily Extract
    2. **Extract** structured product metadata via LLM
    3. **Search** for competitors via Tavily (parallel queries)
    4. **Extract** competitor entities via LLM
    5. **Score** with the deterministic Decision Engine
    6. **Reason** trade-offs and generate recommendation (LLM)
    7. **Verdict** is always determined by the scoring engine, never the LLM

    Cache behavior:
    - `quick` and `standard` depth: results cached for 5–10 min
    - `deep` depth: always runs the full fresh pipeline

    Partial results are returned (status=`partial`) when some pipeline
    stages fail, rather than returning an error.
    """
    logger.info(
        "Analyze request received",
        extra={
            "request_id": request_id,
            "url": str(payload.url),
            "depth": payload.depth,
            "include_competitors": payload.include_competitors,
        },
    )

    try:
        pipeline = AnalyzePipeline()
        result = await pipeline.run(payload, request_id)
    except Exception as exc:
        logger.exception(
            "Pipeline raised unhandled exception",
            extra={"request_id": request_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "pipeline_failure",
                "message": "The analysis pipeline encountered an unexpected error.",
                "request_id": request_id,
            },
        ) from exc

    logger.info(
        "Analyze request complete",
        extra={
            "request_id": request_id,
            "status": result.status,
            "overall_score": result.data.scores.overall if result.data else None,
        },
    )
    return result
