from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from app.core.supabase import get_supabase
from app.models.schemas import Target, TargetCreate
import csv
import io

router = APIRouter()

@router.get("/", response_model=List[Target])
async def list_targets(org_id: str):
    supabase = get_supabase()
    response = supabase.table("targets").select("*").eq("organization_id", org_id).execute()
    return response.data

@router.post("/", response_model=Target)
async def create_target(target: TargetCreate):
    supabase = get_supabase()
    response = supabase.table("targets").insert(target.model_dump()).execute()
    return response.data[0]

@router.post("/batch-upload")
async def batch_upload_targets(org_id: str, file: UploadFile = File(...)):
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    targets_to_add = []
    for row in reader:
        targets_to_add.append({
            "email": row.get("email"),
            "name": row.get("name"),
            "department": row.get("department"),
            "organization_id": org_id
        })
        
    if not targets_to_add:
        raise HTTPException(status_code=400, detail="No valid targets found in CSV")
        
    supabase = get_supabase()
    response = supabase.table("targets").insert(targets_to_add).execute()
    
    return {"status": "success", "count": len(response.data)}
