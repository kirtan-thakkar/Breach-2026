from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Any, Optional
from app.core.supabase import get_supabase
from app.core.auth import require_admin, AuthenticatedUser
from app.services.ml_service import ml_service
from datetime import datetime, timedelta, timezone

router = APIRouter()


def _safe_res_data(response) -> List[dict]:
    return response.data if response and getattr(response, "data", None) else []


def _get_org_ids(supabase, org_id: str) -> Dict[str, List[str]]:
    campaigns_res = supabase.table("campaigns").select("id", count="exact").eq("organization_id", org_id).execute()
    targets_res = supabase.table("targets").select("id", count="exact").eq("organization_id", org_id).execute()

    campaigns = _safe_res_data(campaigns_res)
    targets = _safe_res_data(targets_res)

    return {
        "campaign_ids": [item.get("id") for item in campaigns if item.get("id")],
        "target_ids": [item.get("id") for item in targets if item.get("id")],
        "campaign_count": campaigns_res.count or 0,
        "target_count": targets_res.count or 0,
    }


def _get_org_simulations(supabase, campaign_ids: List[str], target_ids: List[str]) -> List[dict]:
    simulation_map: Dict[str, dict] = {}

    if campaign_ids:
        by_campaign = supabase.table("simulations").select("*").in_("campaign_id", campaign_ids).execute()
        for sim in _safe_res_data(by_campaign):
            sim_id = sim.get("id")
            if sim_id:
                simulation_map[sim_id] = sim

    if target_ids:
        by_target = supabase.table("simulations").select("*").in_("target_id", target_ids).execute()
        for sim in _safe_res_data(by_target):
            sim_id = sim.get("id")
            if sim_id:
                simulation_map[sim_id] = sim

    return list(simulation_map.values())


def _summarize_events(events: List[dict]) -> Dict[str, int]:
    opens = sum(1 for event in events if event.get("event_type") == "email_opened")
    clicks = sum(1 for event in events if event.get("event_type") == "link_clicked")
    submissions = sum(1 for event in events if event.get("event_type") == "credential_submitted")
    return {"opens": opens, "clicks": clicks, "submissions": submissions}


def _compute_risk_from_events(events: List[dict]) -> float:
    if not events:
        return 0

    per_sim: Dict[str, Dict[str, int]] = {}
    for event in events:
        sim_id = event.get("simulation_id")
        if not sim_id:
            continue
        if sim_id not in per_sim:
            per_sim[sim_id] = {"email_opened": 0, "link_clicked": 0, "credential_submitted": 0}
        event_type = event.get("event_type")
        if event_type in per_sim[sim_id]:
            per_sim[sim_id][event_type] += 1

    if not per_sim:
        return 0

    scores = [ml_service.predict_risk_score(stats) for stats in per_sim.values()]
    return round((sum(scores) / len(scores) * 100), 1) if scores else 0


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        normalized = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _build_daily_series(simulations: List[dict], days: int = 7) -> List[dict]:
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days - 1)).date()
    buckets = {
        (start_date + timedelta(days=offset)): 0
        for offset in range(days)
    }

    for sim in simulations:
        created = _parse_iso(sim.get("created_at"))
        if not created:
            continue
        day = created.date()
        if day in buckets:
            buckets[day] += 1

    return [
        {"date": day.isoformat(), "tests_sent": buckets[day]}
        for day in sorted(buckets.keys())
    ]

@router.get("/summary/{org_id}")
async def get_org_summary(org_id: str, admin: AuthenticatedUser = Depends(require_admin)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    supabase = get_supabase()

    org_context = _get_org_ids(supabase, org_id)
    simulations = _get_org_simulations(supabase, org_context["campaign_ids"], org_context["target_ids"])
    sim_ids = [sim.get("id") for sim in simulations if sim.get("id")]

    events = []
    if sim_ids:
        events_res = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
        events = _safe_res_data(events_res)

    totals = _summarize_events(events)
    total_sent = len(simulations)
    click_rate = round((totals["clicks"] / total_sent * 100), 1) if total_sent > 0 else 0
    compromise_rate = round((totals["submissions"] / total_sent * 100), 1) if total_sent > 0 else 0
    risk_score = _compute_risk_from_events(events)

    return {
        "total_campaigns": org_context["campaign_count"],
        "total_targets": org_context["target_count"],
        "total_tests_sent": total_sent,
        "risk_score": risk_score,
        "click_rate": click_rate,
        "compromise_rate": compromise_rate,
        "trend": "org telemetry",
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


@router.get("/overview/{org_id}")
async def get_org_overview(org_id: str, admin: AuthenticatedUser = Depends(require_admin)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    supabase = get_supabase()
    org_context = _get_org_ids(supabase, org_id)
    simulations = _get_org_simulations(supabase, org_context["campaign_ids"], org_context["target_ids"])
    sim_ids = [sim.get("id") for sim in simulations if sim.get("id")]

    events = []
    if sim_ids:
        events_res = supabase.table("simulation_events").select("*").in_("simulation_id", sim_ids).execute()
        events = _safe_res_data(events_res)

    channel_counts: Dict[str, int] = {}
    for sim in simulations:
        channel = sim.get("channel") or "email"
        channel_counts[channel] = channel_counts.get(channel, 0) + 1

    totals = _summarize_events(events)
    total_sent = len(simulations)

    return {
        "daily": _build_daily_series(simulations, days=7),
        "channels": channel_counts,
        "totals": {
            "total_sent": total_sent,
            "total_clicks": totals["clicks"],
            "total_submissions": totals["submissions"],
            "click_rate": round((totals["clicks"] / total_sent * 100), 1) if total_sent > 0 else 0,
            "compromise_rate": round((totals["submissions"] / total_sent * 100), 1) if total_sent > 0 else 0,
        },
    }


@router.get("/employees/{org_id}")
async def get_employee_analytics(org_id: str, admin: AuthenticatedUser = Depends(require_admin)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID required")

    supabase = get_supabase()
    targets_res = (
        supabase.table("targets")
        .select("id, name, email, department, whatsapp_number, created_at")
        .eq("organization_id", org_id)
        .execute()
    )
    targets = _safe_res_data(targets_res)
    if not targets:
        return []

    target_ids = [target.get("id") for target in targets if target.get("id")]
    sims_res = supabase.table("simulations").select("id, target_id, tracking_id, channel, created_at, sent_at").in_("target_id", target_ids).execute()
    simulations = _safe_res_data(sims_res)
    sim_ids = [sim.get("id") for sim in simulations if sim.get("id")]

    events = []
    if sim_ids:
        events_res = supabase.table("simulation_events").select("simulation_id, event_type, created_at").in_("simulation_id", sim_ids).execute()
        events = _safe_res_data(events_res)

    sims_by_target: Dict[str, List[dict]] = {}
    for sim in simulations:
        target_id = sim.get("target_id")
        if not target_id:
            continue
        sims_by_target.setdefault(target_id, []).append(sim)

    event_counts_by_sim: Dict[str, Dict[str, int]] = {}
    event_last_seen_by_sim: Dict[str, datetime] = {}
    for event in events:
        sim_id = event.get("simulation_id")
        if not sim_id:
            continue
        if sim_id not in event_counts_by_sim:
            event_counts_by_sim[sim_id] = {"email_opened": 0, "link_clicked": 0, "credential_submitted": 0}
        event_type = event.get("event_type")
        if event_type in event_counts_by_sim[sim_id]:
            event_counts_by_sim[sim_id][event_type] += 1

        created = _parse_iso(event.get("created_at"))
        if created:
            prev = event_last_seen_by_sim.get(sim_id)
            if not prev or created > prev:
                event_last_seen_by_sim[sim_id] = created

    rows: List[dict] = []
    for target in targets:
        target_id = target.get("id")
        target_sims = sims_by_target.get(target_id, [])

        opened = 0
        clicked = 0
        submitted = 0
        risk_scores = []
        last_tested = None
        last_event = None

        for sim in target_sims:
            sim_id = sim.get("id")
            sim_created = _parse_iso(sim.get("created_at"))
            if sim_created and (not last_tested or sim_created > last_tested):
                last_tested = sim_created

            sim_event = event_last_seen_by_sim.get(sim_id)
            if sim_event and (not last_event or sim_event > last_event):
                last_event = sim_event

            counts = event_counts_by_sim.get(sim_id, {"email_opened": 0, "link_clicked": 0, "credential_submitted": 0})
            opened += counts["email_opened"]
            clicked += counts["link_clicked"]
            submitted += counts["credential_submitted"]
            risk_scores.append(ml_service.predict_risk_score(counts) * 100)

        avg_risk = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0
        rows.append(
            {
                "id": target_id,
                "name": target.get("name"),
                "email": target.get("email"),
                "department": target.get("department"),
                "whatsapp_number": target.get("whatsapp_number"),
                "tests_sent": len(target_sims),
                "email_opened": opened,
                "link_clicked": clicked,
                "credential_submitted": submitted,
                "risk_score": avg_risk,
                "last_tested_at": last_tested.isoformat() if last_tested else None,
                "last_event_at": last_event.isoformat() if last_event else None,
            }
        )

    rows.sort(key=lambda row: row.get("risk_score", 0), reverse=True)
    return rows
