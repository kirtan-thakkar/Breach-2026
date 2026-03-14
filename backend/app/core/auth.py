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


def _is_uuid(value: Optional[str]) -> bool:
    if not value:
        return False
    try:
        import uuid

        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def _resolve_org_id_for_user(supabase, admin_client, user) -> Optional[str]:
    user_metadata = getattr(user, "user_metadata", {}) or {}

    metadata_org = user_metadata.get("organization_id")
    if _is_uuid(metadata_org):
        return str(metadata_org)

    try:
        db_res = admin_client.table("users").select("organization_id").eq("id", user.id).limit(1).execute()
        if db_res.data:
            db_org = db_res.data[0].get("organization_id")
            if _is_uuid(db_org):
                return str(db_org)
    except Exception as org_error:
        logger.warning(f"Organization lookup failed for user {user.id}: {org_error}")

    # Fallback to targets by email when users table is blocked by RLS.
    email = str(getattr(user, "email", "") or "").strip()
    if email:
        try:
            target_res = supabase.table("targets").select("organization_id").eq("email", email).limit(1).execute()
            if target_res.data:
                target_org = target_res.data[0].get("organization_id")
                if _is_uuid(target_org):
                    return str(target_org)
        except Exception as org_error:
            logger.warning(f"Target-based organization lookup failed for user {user.id}: {org_error}")

    # Final fallback for admins: infer from campaigns they created.
    try:
        campaign_res = (
            supabase.table("campaigns")
            .select("organization_id")
            .eq("created_by", str(user.id))
            .limit(1)
            .execute()
        )
        if campaign_res.data:
            campaign_org = campaign_res.data[0].get("organization_id")
            if _is_uuid(campaign_org):
                return str(campaign_org)
    except Exception as org_error:
        logger.warning(f"Campaign-based organization lookup failed for user {user.id}: {org_error}")

    return None

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

        admin = get_supabase_admin()
        org_id = _resolve_org_id_for_user(supabase, admin, user)

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
