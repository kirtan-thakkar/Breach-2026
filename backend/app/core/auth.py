from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import get_supabase, get_supabase_admin
import logging
from typing import List, Optional
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)
security = HTTPBearer()

class AuthenticatedUser(BaseModel):
    id: str
    email: EmailStr
    role: str # admin | user
    organization_id: Optional[str] = None

async def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> AuthenticatedUser:
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.get_user(token.credentials)
        user = auth_response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_metadata = getattr(user, "user_metadata", {}) or {}
        app_metadata = getattr(user, "app_metadata", {}) or {}
        role = user_metadata.get("role") or app_metadata.get("role") or "user"
        
        org_id = user_metadata.get("organization_id")
        if not org_id:
            try:
                admin = get_supabase_admin()
                db_res = admin.table("users").select("organization_id").eq("id", user.id).limit(1).execute()
                if db_res.data:
                    org_id = db_res.data[0].get("organization_id")
            except Exception as org_error:
                logger.warning(f"Organization lookup failed for user {user.id}: {org_error}")

        return AuthenticatedUser(
            id=str(user.id),
            email=str(user.email),
            role=role,
            organization_id=str(org_id) if org_id else None
        )
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_admin(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
