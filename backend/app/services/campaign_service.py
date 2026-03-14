import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import BackgroundTasks
from app.core.supabase import get_supabase, get_supabase_admin
from app.services.messaging.email import email_service
from app.services.messaging.whatsapp import whatsapp_service
from app.services.ai_service import ai_service

class CampaignService:
    async def _insert_test_simulation_best_effort(self, tracking_id: str, channel: str) -> bool:
        """Insert a simulation row using progressively smaller payloads for schema compatibility."""
        admin = get_supabase_admin()
        payload_variants = [
            {"tracking_id": tracking_id, "channel": channel, "email_sent": False},
            {"tracking_id": tracking_id, "email_sent": False},
            {"tracking_id": tracking_id},
        ]

        for payload in payload_variants:
            try:
                admin.table("simulations").insert(payload).execute()
                return True
            except Exception as insert_error:
                print(f"[TEST-SIM] Insert variant failed: {insert_error}")
        return False

    async def _create_test_simulation(self, org_id: Optional[str], channel: str, recipient_email: Optional[str] = None) -> str:
        # Tests should work even if Supabase schema/RLS is not fully aligned.
        tracking_id = str(uuid.uuid4())

        inserted = await self._insert_test_simulation_best_effort(tracking_id=tracking_id, channel=channel)
        if not inserted:
            print("[TEST-SIM] Could not persist tracking ID in simulations table")

        return tracking_id

    async def send_test_email(self, org_id: Optional[str], recipient_email: str) -> dict:
        tracking_id = await self._create_test_simulation(org_id=org_id, channel="email", recipient_email=recipient_email)
        content = await ai_service.generate_random_test_content(channel="email", department="Security Awareness")
        success = await email_service.send_message(
            target_email=recipient_email,
            content=content,
            tracking_id=tracking_id,
        )
        return {
            "success": success,
            "tracking_id": tracking_id,
            "tracking_link": email_service.generate_tracking_link(tracking_id),
            "open_pixel": email_service.generate_pixel_link(tracking_id),
            "subject": content.get("subject"),
        }

    async def send_test_whatsapp(self, org_id: Optional[str], phone_number: str, message_hint: Optional[str] = None) -> dict:
        tracking_id = await self._create_test_simulation(org_id=org_id, channel="whatsapp", recipient_email=None)
        content = await ai_service.generate_random_test_content(channel="whatsapp", department="Mobile Security")
        if message_hint:
            content["content"] = f"{message_hint}\n\n{content.get('content', '')}"

        resolved_message = (content.get("content") or "").replace("[CLICK_HERE]", whatsapp_service.generate_tracking_link(tracking_id))
        whatsapp_uri = whatsapp_service.generate_message_uri(phone_number, resolved_message)

        success = await whatsapp_service.send_message(
            target_phone=phone_number,
            content=content,
            tracking_id=tracking_id,
        )
        return {
            "success": success,
            "tracking_id": tracking_id,
            "tracking_link": whatsapp_service.generate_tracking_link(tracking_id),
            "whatsapp_uri": whatsapp_uri,
            "preview": (content.get("content") or "")[:180],
        }

    async def create_campaign(self, org_id: str, title: str, description: str, template_id: str, campaign_type: str, user_id: str):
        supabase = get_supabase()
        
        # Resolve template_id if it's a fallback string
        actual_template_id = None
        
        try:
            uuid.UUID(str(template_id))
            actual_template_id = template_id
        except (ValueError, TypeError):
            temp_res = supabase.table("templates").select("id").eq("name", template_id).execute()
            if temp_res.data:
                actual_template_id = temp_res.data[0]["id"]
            else:
                default_temp = {
                    "name": template_id,
                    "type": campaign_type,
                    "subject": f"Security Alert: {title}",
                    "content": f"Dear user, this is a security simulation for {title}. Please follow instructions.",
                    "is_ai_generated": False
                }
                try:
                    new_temp = supabase.table("templates").insert(default_temp).execute()
                    if new_temp.data:
                        actual_template_id = new_temp.data[0]["id"]
                except Exception as e:
                    print(f"[CAMPAIGN] Could not create template: {e}")

        data = {
            "organization_id": org_id,
            "title": title,
            "description": description,
            "template_id": actual_template_id,
            "type": campaign_type,
            "created_by": user_id,
            "status": "draft"
        }
        result = supabase.table("campaigns").insert(data).execute()
        return result.data[0] if result.data else None

    async def launch_campaign(self, campaign_id: str, target_ids: List[str], background_tasks: BackgroundTasks, ad_hoc_emails: List[str] = None):
        supabase = get_supabase()
        
        # Update campaign status
        supabase.table("campaigns").update({"status": "running"}).eq("id", campaign_id).execute()
        
        # Get campaign details
        campaign_res = supabase.table("campaigns").select("*, templates(*)").eq("id", campaign_id).single().execute()
        campaign = campaign_res.data
        
        if not campaign:
            return {"error": "Campaign not found"}

        # Add to background tasks
        background_tasks.add_task(self._dispatch_simulation, campaign, target_ids, ad_hoc_emails or [])
        
        total = len(target_ids) + len(ad_hoc_emails or [])
        return {"message": f"Campaign '{campaign['title']}' launched for {total} targets"}

    async def _dispatch_simulation(self, campaign_data: dict, target_ids: List[str], ad_hoc_emails: List[str] = None):
        supabase = get_supabase()
        template = campaign_data.get("templates") or {}
        campaign_type = campaign_data.get("type")
        campaign_desc = campaign_data.get("description", "")
        
        # Determine likely brand
        brand = "Corporate"
        desc_lower = campaign_desc.lower() if campaign_desc else ""
        if "microsoft" in desc_lower or "outlook" in desc_lower:
            brand = "Microsoft 365"
        elif "facebook" in desc_lower:
            brand = "Facebook"
        elif "whatsapp" in desc_lower:
            brand = "WhatsApp"
        elif "linkedin" in desc_lower:
            brand = "LinkedIn"

        # Process registered targets
        for target_id in target_ids:
            try:
                target_res = supabase.table("targets").select("*").eq("id", target_id).single().execute()
                target = target_res.data
                if not target:
                    continue

                await self._send_to_target(supabase, campaign_data, target, brand, desc_lower)
            except Exception as e:
                print(f"[CAMPAIGN-ERROR] Failed for target {target_id}: {e}")

        # Process ad-hoc email recipients
        for email_addr in (ad_hoc_emails or []):
            try:
                fake_target = {"email": email_addr, "department": "External", "name": email_addr.split("@")[0]}
                await self._send_to_target(supabase, campaign_data, fake_target, brand, desc_lower)
            except Exception as e:
                print(f"[CAMPAIGN-ERROR] Failed for ad-hoc {email_addr}: {e}")

        # Update campaign status when done
        supabase.table("campaigns").update({"status": "completed"}).eq("id", campaign_data["id"]).execute()
        print(f"[CAMPAIGN] Campaign '{campaign_data['title']}' completed")

    async def _send_to_target(self, supabase, campaign_data, target, brand, desc_lower):
        tracking_id = str(uuid.uuid4())
        
        # Determine channel
        channel = "email"
        if target.get("whatsapp_number") and ("whatsapp" in desc_lower or "mobile" in desc_lower):
            channel = "whatsapp"

        # Create simulation record
        sim_data = {
            "campaign_id": campaign_data["id"],
            "target_id": target.get("id"),
            "tracking_id": tracking_id,
            "email_sent": False,
            "channel": channel
        }
        supabase.table("simulations").insert(sim_data).execute()

        # Generate dynamic AI content
        content = await ai_service.generate_phishing_content(
            context=campaign_data.get("description", ""),
            target_department=target.get("department", "General"),
            brand=brand
        )

        # Dispatch via appropriate service
        if channel == "email":
            await email_service.send_message(target["email"], content, tracking_id)
        elif channel == "whatsapp":
            await whatsapp_service.send_message(target["whatsapp_number"], content, tracking_id)

campaign_service = CampaignService()
