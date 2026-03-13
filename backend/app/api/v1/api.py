from fastapi import APIRouter
from app.api.v1.endpoints import campaigns, targets, tracking, analytics, ai

api_router = APIRouter()

api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(targets.router, prefix="/targets", tags=["targets"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
