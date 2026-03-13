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
    supabase = get_supabase_admin()
    settings = get_settings()
    campaign_resp = supabase.table("campaigns").select("*, templates(*)").eq("id", campaign_id).execute()
    if not campaign_resp.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaign_resp.data[0]
    template = campaign.get("templates")
    if not template:
        raise HTTPException(status_code=400, detail="Campaign has no valid template")

    org_id = campaign["organization_id"]
    
    targets_resp = supabase.table("targets").select("*").eq("organization_id", org_id).execute()
    targets = targets_resp.data
    
    if not targets:
        return {"status": "info", "message": "No targets found for this organization"}

    simulations_to_insert = []
    email_payloads = []
    
    for target in targets:
        tracking_id = str(uuid.uuid4())
        click_url = f"{settings.APP_BASE_URL}{settings.API_V1_STR}/tracking/click/{tracking_id}"
        
        simulations_to_insert.append({
            "campaign_id": campaign_id,
            "target_id": target["id"],
            "tracking_id": tracking_id
        })
        
        email_payloads.append({
            "email": target["email"],
            "name": target.get("name", "Team Member"),
            "subject": template.get("subject", "Security Alert"),
            "link": click_url
        })
    
    if simulations_to_insert:
        supabase.table("simulations").insert(simulations_to_insert).execute()
    
    supabase.table("campaigns").update({"status": CampaignStatus.RUNNING}).eq("id", campaign_id).execute()
    
    from app.services.email_service import email_service
    import asyncio
    
    asyncio.create_task(email_service.send_simulation_emails(campaign_id, email_payloads))
    
    return {
        "status": "success", 
        "message": f"Campaign '{campaign['title']}' launched. {len(targets)} simulations triggered."
    }

import uuid
from app.core.supabase import get_supabase_admin
