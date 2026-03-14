from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.core.supabase import get_supabase
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/me")
async def get_my_stats(user: any = Depends(get_current_user)):
    """
    Get statistics for the currently logged-in end user.
    """
    email = user.email
    supabase = get_supabase()
    
    # 1. Find if this user is a target in any organization
    target_response = supabase.table("targets").select("*").eq("email", email).execute()
    
    if not target_response.data:
        # Return demo/empty data if user doesn't exist as target yet
        return {
            "is_target": False,
            "total_simulations": 0,
            "clicks": 0,
            "credential_submissions": 0,
            "risk_score": 0.0,
            "recent_events": []
        }
    
    target_ids = [t["id"] for t in target_response.data]
    
    # 2. Get simulations for these target instances
    sims = supabase.table("simulations").select("id").in_("target_id", target_ids).execute()
    sim_ids = [s["id"] for s in sims.data]
    
    if not sim_ids:
        return {
            "is_target": True,
            "total_simulations": 0,
            "clicks": 0,
            "credential_submissions": 0,
            "risk_score": 0.1, # Base score
            "recent_events": []
        }
        
    # 3. Get events linked to these simulations
    events = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
    
    clicks = [e for e in events.data if e["event_type"] == "link_clicked"]
    submissions = [e for e in events.data if e["event_type"] == "credential_submitted"]
    
    return {
        "is_target": True,
        "total_simulations": len(sim_ids),
        "clicks": len(clicks),
        "credential_submissions": len(submissions),
        "risk_score": (len(clicks) * 0.4 + len(submissions) * 0.6) / len(sim_ids) if sim_ids else 0,
        "recent_events": events.data[:5] # Last 5
    }
