from datetime import datetime
from typing import Optional
import uuid
from app.core.supabase import get_supabase

class TrackingService:
    @staticmethod
    def _canonical_tracking_id(tracking_id: str) -> str:
        """Map legacy non-UUID ids to deterministic UUIDs for schema compatibility."""
        try:
            return str(uuid.UUID(str(tracking_id)))
        except (ValueError, TypeError):
            return str(uuid.uuid5(uuid.NAMESPACE_URL, f"breach-tracking:{tracking_id}"))

    async def _find_simulation(self, tracking_id: str):
        supabase = get_supabase()
        canonical = self._canonical_tracking_id(tracking_id)

        # Avoid .single() because PostgREST returns 406 when row count != 1.
        query = supabase.table("simulations").select("*").eq("tracking_id", canonical).limit(1).execute()
        data = query.data or []
        return data[0] if data else None

    async def _ensure_simulation_stub(self, tracking_id: str) -> Optional[dict]:
        """Best effort insert for test links when a simulation row is missing."""
        supabase = get_supabase()
        canonical = self._canonical_tracking_id(tracking_id)
        for payload in (
            {"tracking_id": canonical, "email_sent": False, "channel": "email"},
            {"tracking_id": canonical, "email_sent": False},
            {"tracking_id": canonical},
        ):
            try:
                supabase.table("simulations").insert(payload).execute()
                break
            except Exception as e:
                print(f"[TRACKING] Stub insert variant failed: {e}")

        return await self._find_simulation(tracking_id)

    async def log_event(self, tracking_id: str, event_type: str, ip_address: str = "", user_agent: str = "", metadata: Optional[dict] = None):
        """Log a simulation event (open, click, credential)."""
        try:
            supabase = get_supabase()
            sim = await self._find_simulation(tracking_id)
            if not sim:
                sim = await self._ensure_simulation_stub(tracking_id)
                if not sim:
                    print(f"[TRACKING] Tracking ID {tracking_id} not found")
                    return None

            event_data = {
                "simulation_id": sim["id"],
                "event_type": event_type,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            }
            
            supabase.table("simulation_events").insert(event_data).execute()
            
            # Update simulation last_event_at for quick lookup
            supabase.table("simulations").update({
                "last_event_at": datetime.utcnow().isoformat()
            }).eq("id", sim["id"]).execute()
                
            print(f"[TRACKING] Event '{event_type}' logged for tracking_id={tracking_id}")
            return sim
        except Exception as e:
            print(f"[TRACKING-ERROR] Failed to log event: {e}")
            return None

    async def capture_credentials(self, tracking_id: str, password: str, metadata: Optional[dict] = None):
        """Safe credential capture: compute strength, discard password."""
        sim = await self.log_event(tracking_id, "credential_submitted", metadata=metadata)
        if not sim:
            return None

        strength = self._calculate_password_strength(password)
        
        # Log only strength metadata to credentials_audit
        audit_data = {
            "simulation_id": sim["id"],
            "password_strength": strength,
            "length": len(password),
            "contains_special_chars": any(not c.isalnum() for c in password),
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            supabase = get_supabase()
            supabase.table("credentials_audit").insert(audit_data).execute()
        except Exception as e:
            print(f"[TRACKING] Error logging audit (table may not exist yet): {e}")
            
        stats = await self.get_tracking_stats(tracking_id)
        return {
            "strength": strength,
            "message": "Credential submitted. This was a simulation.",
            "stats": stats,
        }

    async def get_tracking_stats(self, tracking_id: str) -> Optional[dict]:
        """Return click and credential counters for a single tracking id."""
        try:
            supabase = get_supabase()
            sim = await self._find_simulation(tracking_id)
            if not sim:
                return None

            events_res = supabase.table("simulation_events").select("event_type").eq("simulation_id", sim["id"]).execute()
            events = events_res.data or []

            clicks = sum(1 for item in events if item.get("event_type") == "link_clicked")
            credentials = sum(1 for item in events if item.get("event_type") == "credential_submitted")
            opens = sum(1 for item in events if item.get("event_type") == "email_opened")

            return {
                "tracking_id": sim.get("tracking_id", tracking_id),
                "email_opened": opens,
                "link_clicked": clicks,
                "credential_submitted": credentials,
            }
        except Exception as e:
            print(f"[TRACKING-ERROR] Failed to compute stats: {e}")
            return None

    def _calculate_password_strength(self, password: str) -> str:
        if len(password) < 6:
            return "low"
        has_num = any(c.isdigit() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_special = any(not c.isalnum() for c in password)
        
        score = sum([has_num, has_upper, has_special])
        if score >= 3 and len(password) >= 10:
            return "high"
        if score >= 2:
            return "medium"
        return "low"

tracking_service = TrackingService()
