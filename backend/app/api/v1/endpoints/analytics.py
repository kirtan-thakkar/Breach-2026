from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any, Optional
from app.core.supabase import get_supabase
from app.core.auth import require_admin, AuthenticatedUser
from app.services.ml_service import ml_service

router = APIRouter()

@router.get("/summary/{org_id}")
async def get_org_summary(org_id: str, admin: AuthenticatedUser = Depends(require_admin)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    supabase = get_supabase()
    
    # Get stats filtered by organization_id
    campaigns = supabase.table("campaigns").select("id", count="exact").eq("organization_id", org_id).execute()
    targets = supabase.table("targets").select("id", count="exact").eq("organization_id", org_id).execute()
    
    # Get all simulations for this org's campaigns
    campaign_ids = [c["id"] for c in (campaigns.data or [])]
    if not campaign_ids:
        return {
            "total_campaigns": 0,
            "total_targets": targets.count or 0,
            "risk_score": 0,
            "trend": "no data"
        }

    sims = supabase.table("simulations").select("id, target_id").in_("campaign_id", campaign_ids).execute()
    sim_ids = [s["id"] for s in sims.data]
    
    if not sim_ids:
        return {
            "total_campaigns": campaigns.count or 0,
            "total_targets": targets.count or 0,
            "risk_score": 0,
            "trend": "no simulations"
        }

    events = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
    
    # ML aggregation
    avg_risk = 0
    if events.data:
        target_stats = {}
        for event in events.data:
            sid = event.get("simulation_id")
            if sid not in target_stats: 
                target_stats[sid] = {"email_opened": 0, "link_clicked": 0, "credential_submitted": 0}
            target_stats[sid][event["event_type"]] = target_stats[sid].get(event["event_type"], 0) + 1
        
        scores = [ml_service.predict_risk_score(stats) for stats in target_stats.values()]
        avg_risk = (sum(scores) / len(scores) * 100) if scores else 0

    return {
        "total_campaigns": campaigns.count or 0,
        "total_targets": targets.count or 0,
        "risk_score": round(avg_risk, 1), 
        "trend": "ML calculated"
    }

@router.get("/campaign/{campaign_id}")
async def get_campaign_analytics(campaign_id: str, admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    
    sims = supabase.table("simulations").select("id").eq("campaign_id", campaign_id).execute()
    total_sent = len(sims.data)
    
    if total_sent == 0:
        return {
            "total_sent": 0,
            "total_clicks": 0,
            "total_submissions": 0,
            "click_rate": 0,
            "compromise_rate": 0,
            "risk_score": 0
        }
        
    sim_ids = [s["id"] for s in sims.data]
    events_res = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
    events = events_res.data
    
    clicks = [e for e in events if e["event_type"] == "link_clicked"]
    submissions = [e for e in events if e["event_type"] == "credential_submitted"]
    opens = [e for e in events if e["event_type"] == "email_opened"]
    
    campaign_stats = {
        "email_opened": len(opens),
        "link_clicked": len(clicks),
        "credential_submitted": len(submissions)
    }
    risk_score = ml_service.predict_risk_score(campaign_stats)
    
    return {
        "total_sent": total_sent,
        "total_clicks": len(clicks),
        "total_submissions": len(submissions),
        "click_rate": round((len(clicks) / total_sent * 100), 1) if total_sent > 0 else 0,
        "compromise_rate": round((len(submissions) / total_sent * 100), 1) if total_sent > 0 else 0,
        "risk_score": round(risk_score * 100, 1)
    }
