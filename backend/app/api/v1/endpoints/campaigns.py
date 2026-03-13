from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.supabase import get_supabase
from app.models.schemas import Campaign, CampaignCreate, CampaignStatus
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()

@router.get("/", response_model=List[Campaign])
async def list_campaigns(org_id: str):
    supabase = get_supabase()
    response = supabase.table("campaigns").select("*").eq("organization_id", org_id).execute()
    return response.data

@router.post("/", response_model=Campaign)
async def create_campaign(campaign: CampaignCreate):
    supabase = get_supabase()
    data = campaign.model_dump()
    data["status"] = CampaignStatus.DRAFT
    
    response = supabase.table("campaigns").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create campaign")
        
    return response.data[0]

@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str):
    supabase = get_supabase()
    campaign_resp = supabase.table("campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_resp.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaign_resp.data[0]
    org_id = campaign["organization_id"]
    
    targets_resp = supabase.table("targets").select("*").eq("organization_id", org_id).execute()
    targets = targets_resp.data
    
    simulations = []
    for target in targets:
        simulations.append({
            "campaign_id": campaign_id,
            "target_id": target["id"],
            "status": "sent",
            "tracking_id": str(uuid.uuid4())
        })
    
    if simulations:
        supabase.table("simulations").insert(simulations).execute()
        
    supabase.table("campaigns").update({"status": CampaignStatus.RUNNING}).eq("id", campaign_id).execute()
    
    # 4. TODO: Trigger Background Task to send emails
    
    return {"status": "success", "message": f"Campaign launched for {len(targets)} targets"}

import uuid
