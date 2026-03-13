from fastapi import APIRouter, Depends
from typing import Dict, List
from app.core.supabase import get_supabase
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary/{org_id}")
async def get_org_summary(org_id: str):
    supabase = get_supabase()
    campaigns = supabase.table("campaigns").select("id", count="exact").eq("organization_id", org_id).execute()
    targets = supabase.table("targets").select("id", count="exact").eq("organization_id", org_id).execute()
    return {
        "total_campaigns": campaigns.count,
        "total_targets": targets.count,
        "risk_score": 42, 
        "trend": "decreasing"
    }

@router.get("/campaign/{campaign_id}")
async def get_campaign_analytics(campaign_id: str):
    supabase = get_supabase()
    sims = supabase.table("simulations").select("id, status").eq("campaign_id", campaign_id).execute()
    total_sent = len(sims.data)
    sim_ids = [s["id"] for s in sims.data]
    events = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
    clicks = [e for e in events.data if e["event_type"] == "link_clicked"]
    submissions = [e for e in events.data if e["event_type"] == "form_submitted"]
    return {
        "total_sent": total_sent,
        "total_clicks": len(clicks),
        "total_submissions": len(submissions),
        "click_rate": (len(clicks) / total_sent * 100) if total_sent > 0 else 0,
        "compromise_rate": (len(submissions) / total_sent * 100) if total_sent > 0 else 0
    }
