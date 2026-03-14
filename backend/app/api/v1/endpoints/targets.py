from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Optional
from app.core.supabase import get_supabase, get_supabase_admin
from app.models.schemas import Target, TargetCreate
from app.core.auth import require_admin, AuthenticatedUser
from app.services.campaign_service import campaign_service
from pydantic import BaseModel
import csv
import io
import uuid

router = APIRouter()


class TargetAttackRequest(BaseModel):
    attack_type: str


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def _resolve_org_id(supabase, org_id: Optional[str], fallback_org_id: Optional[str] = None) -> str:
    candidate = str(org_id).strip() if org_id and str(org_id).strip() else None
    fallback = str(fallback_org_id).strip() if fallback_org_id and str(fallback_org_id).strip() else None

    # Prefer explicit UUID from request/body.
    if candidate and _is_uuid(candidate):
        return candidate

    # Then authenticated user org.
    if fallback and _is_uuid(fallback):
        return fallback

    # Legacy/demo value support.
    if candidate and candidate != "demo-org":
        raise HTTPException(status_code=400, detail="Invalid organization id")

    # Do NOT try to create organizations here (can fail under RLS/service-key issues).
    # Resolve an existing org id from known tables.
    default_org = supabase.table("organizations").select("id").eq("name", "Default").limit(1).execute()
    if default_org.data:
        return default_org.data[0]["id"]

    any_org = supabase.table("organizations").select("id").limit(1).execute()
    if any_org.data:
        return any_org.data[0]["id"]

    raise HTTPException(
        status_code=400,
        detail="No organization found. Create one in Supabase (e.g. 'Default') and try again.",
    )

@router.get("", response_model=List[Target])
async def list_targets(org_id: Optional[str] = None, admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    resolved_org_id = _resolve_org_id(supabase, org_id, admin.organization_id)
    response = supabase.table("targets").select("*").eq("organization_id", resolved_org_id).execute()
    return response.data

@router.post("", response_model=Target)
async def create_target(target: TargetCreate, admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    payload = target.model_dump()
    payload["organization_id"] = _resolve_org_id(supabase, payload.get("organization_id"), admin.organization_id)
    response = supabase.table("targets").insert(payload).execute()
    return response.data[0]

@router.post("/batch-upload")
async def batch_upload_targets(org_id: Optional[str] = None, file: UploadFile = File(...), admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    resolved_org_id = _resolve_org_id(supabase, org_id, admin.organization_id)

    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    targets_to_add = []
    for row in reader:
        whatsapp_number = row.get("whatsapp_number") or row.get("mobile") or row.get("phone")
        targets_to_add.append({
            "email": row.get("email"),
            "name": row.get("name"),
            "department": row.get("department"),
            "whatsapp_number": whatsapp_number,
            "organization_id": resolved_org_id
        })
        
    if not targets_to_add:
        raise HTTPException(status_code=400, detail="No valid targets found in CSV")
        
    response = supabase.table("targets").insert(targets_to_add).execute()
    
    return {"status": "success", "count": len(response.data)}


@router.post("/{target_id}/test-attack")
async def test_target_attack(target_id: str, payload: TargetAttackRequest, admin: AuthenticatedUser = Depends(require_admin)):
    result = await campaign_service.send_target_test_attack(
        org_id=admin.organization_id,
        target_id=target_id,
        attack_type=payload.attack_type,
    )

    if result.get("success"):
        return {
            "status": "ok",
            "message": result.get("message") or "Test attack dispatched",
            "tracking_id": result.get("tracking_id"),
            "tracking_link": result.get("tracking_link"),
            "dispatch_uri": result.get("dispatch_uri"),
            "channel": result.get("channel"),
            "attack_type": result.get("attack_type"),
            "preview": result.get("preview"),
        }

    detail = result.get("error") or "Failed to dispatch test attack"
    raise HTTPException(status_code=400, detail=detail)
