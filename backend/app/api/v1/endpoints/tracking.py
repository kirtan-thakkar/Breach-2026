from fastapi import APIRouter, Request, HTTPException
from app.core.supabase import get_supabase_admin
from app.models.schemas import SimulationEventCreate, EventType
import uuid

router = APIRouter()

@router.get("/click/{simulation_id}")
async def track_click(simulation_id: str, request: Request):
    supabase = get_supabase_admin()
    event_data = {
        "simulation_id": simulation_id,
        "event_type": EventType.LINK_CLICKED,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "created_at": "now()"
    }
    
    try:
        response = supabase.table("simulation_events").insert(event_data).execute()
        
        
    except Exception as e:
        print(f"Error tracking click: {e}")

    return {"message": "You clicked a simulated phishing link. This is a training exercise.", "safety_tip": "Always check the sender address and hover over links before clicking."}

@router.post("/submit/{simulation_id}")
async def track_submission(simulation_id: str, request: Request):
    supabase = get_supabase_admin()
    event_data = {
        "simulation_id": simulation_id,
        "event_type": EventType.FORM_SUBMITTED,
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "created_at": "now()"
    }
    
    try:
        supabase.table("simulation_events").insert(event_data).execute()
    except Exception as e:
        print(f"Error tracking submission: {e}")
        
    return {"message": "Information submitted in training simulation.", "status": "logged"}
