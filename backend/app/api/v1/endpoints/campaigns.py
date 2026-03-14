from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional
from app.models.schemas import Campaign, CampaignCreate
from app.core.config import get_settings
from app.core.supabase import get_supabase, get_supabase_admin
from pydantic import BaseModel, EmailStr

from app.core.auth import require_admin, AuthenticatedUser
from app.services.campaign_service import campaign_service

router = APIRouter()
settings = get_settings()

class CampaignLaunchRequest(BaseModel):
    target_ids: List[str] | None = None
    ad_hoc_emails: List[str] | None = None

class TestEmailRequest(BaseModel):
    email: EmailStr

class TestWhatsAppRequest(BaseModel):
    phone_number: str
    message: Optional[str] = None

class TestCalendarRequest(BaseModel):
    email: EmailStr


def _resolve_campaign_org_id(supabase, requested_org_id: Optional[str], admin: AuthenticatedUser) -> Optional[str]:
    if requested_org_id:
        return requested_org_id
    if admin.organization_id:
        return admin.organization_id

    # Fallback: infer from admin email if present in targets.
    if getattr(admin, "email", None):
        try:
            target_res = (
                supabase.table("targets")
                .select("organization_id")
                .eq("email", str(admin.email))
                .limit(1)
                .execute()
            )
            if target_res.data:
                inferred = target_res.data[0].get("organization_id")
                if inferred:
                    return inferred
        except Exception:
            pass

    # Last resort: use any organization present in campaigns.
    try:
        campaign_res = supabase.table("campaigns").select("organization_id").limit(1).execute()
        if campaign_res.data:
            inferred = campaign_res.data[0].get("organization_id")
            if inferred:
                return inferred
    except Exception:
        pass

    return None

def _normalize_campaign_row(row: dict) -> dict:
    normalized = dict(row)
    if "name" not in normalized and "title" in normalized:
        normalized["name"] = normalized.get("title")
    return normalized

@router.post("/test-email")
async def send_test_email(payload: TestEmailRequest, admin: AuthenticatedUser = Depends(require_admin)):
    result = await campaign_service.send_test_email(admin.organization_id, payload.email)
    if result.get("success"):
        return {
            "status": "ok",
            "message": f"Randomized LLM test email sent to {payload.email}",
            "subject": result.get("subject"),
            "tracking_id": result.get("tracking_id"),
            "tracking_link": result.get("tracking_link"),
            "open_pixel": result.get("open_pixel"),
        }
    
    raise HTTPException(status_code=500, detail="Email delivery failed. Check SMTP credentials in .env file.")

@router.post("/test-calendar")
async def send_test_calendar(payload: TestCalendarRequest, admin: AuthenticatedUser = Depends(require_admin)):
    result = await campaign_service.send_test_calendar_invite(admin.organization_id, payload.email)
    if result.get("success"):
        return {
            "status": "ok",
            "message": f"Calendar meeting invite sent to {payload.email}",
            "subject": result.get("subject"),
            "tracking_id": result.get("tracking_id"),
            "tracking_link": result.get("tracking_link"),
            "open_pixel": result.get("open_pixel"),
        }
    raise HTTPException(status_code=500, detail="Calendar invite delivery failed. Check SMTP credentials in .env file.")

@router.post("/test-whatsapp")
async def send_test_whatsapp(payload: TestWhatsAppRequest, admin: AuthenticatedUser = Depends(require_admin)):
    result = await campaign_service.send_test_whatsapp(
        org_id=admin.organization_id,
        phone_number=payload.phone_number,
        message_hint=payload.message,
    )
    if result.get("success"):
        return {
            "status": "ok",
            "message": f"WhatsApp test dispatched to {payload.phone_number}",
            "tracking_id": result.get("tracking_id"),
            "tracking_link": result.get("tracking_link"),
            "whatsapp_uri": result.get("whatsapp_uri"),
            "preview": result.get("preview"),
        }
    
    raise HTTPException(status_code=500, detail="WhatsApp dispatch failed")

@router.get("", response_model=List[Campaign])
async def list_campaigns(org_id: Optional[str] = None, admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    target_org_id = _resolve_campaign_org_id(supabase, org_id, admin)
    if not target_org_id:
        return []
    response = supabase.table("campaigns").select("*").eq("organization_id", target_org_id).execute()
    return [_normalize_campaign_row(item) for item in response.data]

@router.post("", response_model=Campaign)
async def create_campaign(campaign: CampaignCreate, admin: AuthenticatedUser = Depends(require_admin)):
    supabase = get_supabase()
    resolved_org_id = _resolve_campaign_org_id(supabase, campaign.organization_id, admin)
    if not resolved_org_id:
        raise HTTPException(status_code=400, detail="Organization ID required to create campaign")

    creator_user_id = None
    try:
        admin_client = get_supabase_admin()
        admin_client.table("users").upsert(
            {
                "id": admin.id,
                "organization_id": resolved_org_id,
                "email": admin.email,
                "name": str(admin.email).split("@")[0],
                "role": admin.role,
            },
            on_conflict="id",
        ).execute()
        creator_user_id = admin.id
    except Exception as error:
        print(f"[CAMPAIGN] Users sync skipped for campaign creator {admin.id}: {error}")

    data = await campaign_service.create_campaign(
        org_id=resolved_org_id,
        title=campaign.name,
        description=campaign.description or "",
        template_id=campaign.template_id,
        campaign_type=campaign.type,
        user_id=creator_user_id,
        scheduled_at=campaign.scheduled_at,
        include_qr_code=campaign.include_qr_code,
        attack_channel=campaign.attack_channel or "email_link",
    )
    if not data:
        raise HTTPException(status_code=400, detail="Failed to create campaign")
    return _normalize_campaign_row(data)

@router.post("/{campaign_id}/launch")
async def launch_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    payload: CampaignLaunchRequest | None = None,
    admin: AuthenticatedUser = Depends(require_admin),
):
    supabase = get_supabase_admin()
    
    org_id_resp = supabase.table("campaigns").select("organization_id").eq("id", campaign_id).single().execute()
    if not org_id_resp.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    org_id = org_id_resp.data["organization_id"]
    
    target_ids = payload.target_ids if payload and payload.target_ids else []
    ad_hoc_emails = payload.ad_hoc_emails if payload and payload.ad_hoc_emails else []

    if ad_hoc_emails:
        upsert_rows = [
            {"organization_id": org_id, "email": em, "name": em.split("@")[0], "department": "Ad-hoc"}
            for em in ad_hoc_emails
        ]
        try:
            res = supabase.table("targets").upsert(upsert_rows, on_conflict="organization_id,email").execute()
            if res.data:
                target_ids.extend([r["id"] for r in res.data])
        except Exception as e:
            print(f"[LAUNCH] Ad-hoc upsert error: {e}")
            # Still try to insert individually
            for em in ad_hoc_emails:
                try:
                    row = {"organization_id": org_id, "email": em, "name": em.split("@")[0], "department": "Ad-hoc"}
                    r = supabase.table("targets").insert(row).execute()
                    if r.data:
                        target_ids.append(r.data[0]["id"])
                except Exception:
                    pass

    if not target_ids:
        all_targets = supabase.table("targets").select("id").eq("organization_id", org_id).execute()
        target_ids = [t["id"] for t in all_targets.data]

    if not target_ids:
        raise HTTPException(status_code=400, detail="No targets found for this campaign")

    result = await campaign_service.launch_campaign(campaign_id, target_ids, background_tasks, ad_hoc_emails)
    return result
