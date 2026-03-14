from fastapi import APIRouter, Depends
from app.core.auth import require_admin, AuthenticatedUser
from app.core.supabase import get_supabase, get_supabase_admin
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/mine")
async def get_my_organization(admin: AuthenticatedUser = Depends(require_admin)):
    """
    Returns the organization the currently logged-in admin belongs to.
    Uses service-role client to bypass RLS on the organizations table.
    """
    if admin.organization_id:
        # Try to return name too.
        try:
            supabase = get_supabase_admin()
            res = supabase.table("organizations").select("id, name").eq("id", admin.organization_id).limit(1).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
        return {"id": admin.organization_id, "name": None}

    # Fallback: find any org if auth didn't resolve one.
    try:
        supabase = get_supabase_admin()
        res = supabase.table("organizations").select("id, name").limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        logger.warning(f"Organization mine fallback failed: {e}")

    return {"id": None, "name": None}
