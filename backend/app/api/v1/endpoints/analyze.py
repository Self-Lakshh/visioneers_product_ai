"""
POST /api/v1/analyze
Highly explicit route to handle any trailing slash variations.
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.core.logging import get_logger
from app.schemas.input_schema import AnalyzeRequest
from app.services.analyze import AnalyzePipeline
from app.utils.dependencies import RequestIdDep

logger = get_logger(__name__)
# Explicitly allow both /analyze and /analyze/ to handle heterogeneous clients
router = APIRouter()

@router.post(
    "",
    summary="Analyze a product idea (root)",
    tags=["analyze"],
)
async def analyze_product_root(
    payload: AnalyzeRequest,
    request_id: RequestIdDep,
):
    pipeline = AnalyzePipeline()
    async def event_generator():
        async for chunk in pipeline.run_stream(payload, request_id):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@router.post(
    "/",
    summary="Analyze a product idea (trailing slash)",
    tags=["analyze"],
)
async def analyze_product_slash(
    payload: AnalyzeRequest,
    request_id: RequestIdDep,
):
    # Just proxy to the same logic
    return await analyze_product_root(payload, request_id)
