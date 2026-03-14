from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Optional
from app.core.supabase import get_supabase, get_supabase_admin
from app.models.schemas import Target, TargetCreate
from app.core.auth import require_admin, AuthenticatedUser
import csv
import io
import uuid

router = APIRouter()


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def _resolve_org_id(supabase, org_id: Optional[str], fallback_org_id: Optional[str] = None) -> str:
    if org_id and str(org_id).strip():
        org_id = str(org_id).strip()
    else:
        org_id = fallback_org_id

    if org_id and _is_uuid(org_id):
        return org_id

    if not org_id:
        raise HTTPException(status_code=400, detail="Missing organization id")

    if org_id != "demo-org":
        raise HTTPException(status_code=400, detail="Invalid organization id")

    org_response = supabase.table("organizations").select("id").eq("name", "Default").limit(1).execute()
    if org_response.data:
        return org_response.data[0]["id"]

    admin = get_supabase_admin()
    created = admin.table("organizations").insert({"name": "Default"}).execute()
    if created.data:
        return created.data[0]["id"]

    raise HTTPException(status_code=400, detail="Unable to resolve organization")

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
        targets_to_add.append({
            "email": row.get("email"),
            "name": row.get("name"),
            "department": row.get("department"),
            "organization_id": resolved_org_id
        })
        
    if not targets_to_add:
        raise HTTPException(status_code=400, detail="No valid targets found in CSV")
        
    response = supabase.table("targets").insert(targets_to_add).execute()
    
    return {"status": "success", "count": len(response.data)}
