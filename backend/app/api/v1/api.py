from fastapi import APIRouter
from app.api.v1.endpoints import campaigns, targets, tracking, analytics, ai, auth, users, chat, organizations

api_router = APIRouter()

api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(targets.router, prefix="/targets", tags=["targets"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
