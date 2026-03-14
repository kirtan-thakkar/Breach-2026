import asyncio
import uuid
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import BackgroundTasks
from app.core.supabase import get_supabase, get_supabase_admin
from app.services.messaging.email import email_service
from app.services.messaging.whatsapp import whatsapp_service
from app.services.ai_service import ai_service


ATTACK_CHANNEL_MAP = {
    "email_link": "email",
    "whatsapp": "whatsapp",
    "qr_in_email": "qr_in_email",
    "meeting_mail": "meeting_mail",
    "telegram": "telegram",
}


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

    async def send_test_calendar_invite(self, org_id: Optional[str], recipient_email: str) -> dict:
        tracking_id = await self._create_test_simulation(org_id=org_id, channel="meeting_mail", recipient_email=recipient_email)
        content = {
            "subject": "Mandatory Security Leadership Briefing - Meeting Invite",
        }
        success = await email_service.send_calendar_invite(
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

    async def send_target_test_attack(self, org_id: str, target_id: str, attack_type: str) -> dict:
        supabase = get_supabase()
        normalized_attack = (attack_type or "").strip().lower()
        if normalized_attack not in ATTACK_CHANNEL_MAP:
            return {"success": False, "error": "Unsupported attack type"}

        target_res = (
            supabase.table("targets")
            .select("id, organization_id, email, name, department, whatsapp_number")
            .eq("id", target_id)
            .single()
            .execute()
        )
        target = target_res.data
        if not target:
            return {"success": False, "error": "Target not found"}

        if str(target.get("organization_id")) != str(org_id):
            return {"success": False, "error": "Target does not belong to your organization"}

        tracking_id = str(uuid.uuid4())
        channel = ATTACK_CHANNEL_MAP[normalized_attack]

        try:
            supabase.table("simulations").insert(
                {
                    "target_id": target_id,
                    "tracking_id": tracking_id,
                    "channel": channel,
                    "email_sent": False,
                }
            ).execute()
        except Exception as insert_error:
            print(f"[TARGET-TEST] Failed to create simulation row: {insert_error}")
            return {"success": False, "error": "Unable to persist test simulation"}

        delivery_result = await self._dispatch_target_attack(target=target, tracking_id=tracking_id, attack_type=normalized_attack)
        return {
            "success": bool(delivery_result.get("success")),
            "tracking_id": tracking_id,
            "tracking_link": email_service.generate_tracking_link(tracking_id),
            "attack_type": normalized_attack,
            "channel": channel,
            "dispatch_uri": delivery_result.get("dispatch_uri"),
            "preview": delivery_result.get("preview"),
            "message": delivery_result.get("message"),
            "error": delivery_result.get("error"),
        }

    async def _dispatch_target_attack(self, target: dict, tracking_id: str, attack_type: str) -> dict:
        email = target.get("email")
        whatsapp_number = target.get("whatsapp_number")
        department = target.get("department") or "General"

        if attack_type == "whatsapp":
            if not whatsapp_number:
                return {"success": False, "error": "Selected employee has no WhatsApp number"}

            content = await ai_service.generate_random_test_content(channel="whatsapp", department=department)
            preview = (content.get("content") or "")[:180]
            resolved_message = (content.get("content") or "").replace(
                "[CLICK_HERE]", whatsapp_service.generate_tracking_link(tracking_id)
            )
            whatsapp_uri = whatsapp_service.generate_message_uri(whatsapp_number, resolved_message)
            success = await whatsapp_service.send_message(whatsapp_number, content, tracking_id)
            return {
                "success": success,
                "dispatch_uri": whatsapp_uri,
                "preview": preview,
                "message": f"WhatsApp test prepared for {target.get('name') or email}",
            }

        if attack_type == "telegram":
            phishing_link = email_service.generate_tracking_link(tracking_id)
            message_body = (
                "Urgent security review required. "
                f"Open this secure verification link now: {phishing_link}"
            )
            dispatch_uri = f"https://t.me/share/url?url={urllib.parse.quote(phishing_link, safe='')}&text={urllib.parse.quote(message_body, safe='')}"
            await email_service.log_delivery(tracking_id, True)
            return {
                "success": True,
                "dispatch_uri": dispatch_uri,
                "preview": message_body,
                "message": f"Telegram test link generated for {target.get('name') or email}",
            }

        if not email:
            return {"success": False, "error": "Selected employee has no email address"}

        content = await self._build_email_attack_content(attack_type=attack_type, department=department)
        if attack_type == "meeting_mail":
            success = await email_service.send_calendar_invite(target_email=email, content=content, tracking_id=tracking_id)
            return {
                "success": success,
                "preview": content.get("subject", ""),
                "message": f"Calendar meeting invite sent to {email}",
            }
        success = await email_service.send_message(target_email=email, content=content, tracking_id=tracking_id)
        return {
            "success": success,
            "preview": (content.get("content") or "")[:180],
            "message": f"{attack_type.replace('_', ' ').title()} test sent to {email}",
        }

    async def _build_email_attack_content(self, attack_type: str, department: str) -> dict:
        if attack_type == "meeting_mail":
            return {
                "subject": "Mandatory Leadership Meeting: Security Briefing",
                "content": (
                    f"Your {department} team is listed for an urgent leadership security briefing. "
                    "Confirm attendance and view the private agenda here: [CLICK_HERE]."
                    "<br/><br/><small>[TRAINING SIMULATION - INTERNAL USE ONLY]</small>"
                ),
            }

        if attack_type == "qr_in_email":
            return {
                "subject": "Action Needed: Mobile Identity Verification",
                "content": (
                    "Security requires one-time mobile verification. Scan the QR code below and continue."
                    "<br/><br/>[QR_CODE]"
                    "<br/><br/>If scanning fails, use this fallback link: [CLICK_HERE]"
                    "<br/><br/><small>[TRAINING SIMULATION - INTERNAL USE ONLY]</small>"
                ),
                "include_qr_code": True,
            }

        # Default attack type: classic email link phishing simulation.
        return await ai_service.generate_random_test_content(channel="email", department=department)

    async def create_campaign(
        self,
        org_id: str,
        title: str,
        description: str,
        template_id: str,
        campaign_type: str,
        user_id: Optional[str],
        scheduled_at: Optional[datetime] = None,
        include_qr_code: bool = False,
        attack_channel: str = "email_link",
    ):
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

        normalized_scheduled_at = scheduled_at.isoformat() if scheduled_at else None
        initial_status = "scheduled" if scheduled_at and scheduled_at > datetime.now(timezone.utc) else "draft"

        data = {
            "organization_id": org_id,
            "title": title,
            "description": description,
            "template_id": actual_template_id,
            "type": campaign_type,
            "scheduled_at": normalized_scheduled_at,
            "include_qr_code": include_qr_code,
            "attack_channel": attack_channel,
            "status": "draft",
        }
        data["status"] = initial_status
        if user_id:
            data["created_by"] = user_id
        result = supabase.table("campaigns").insert(data).execute()
        return result.data[0] if result.data else None

    async def launch_campaign(self, campaign_id: str, target_ids: List[str], background_tasks: BackgroundTasks, ad_hoc_emails: List[str] = None):
        supabase = get_supabase()

        # Get campaign details
        campaign_res = supabase.table("campaigns").select("*, templates(*)").eq("id", campaign_id).single().execute()
        campaign = campaign_res.data
        
        if not campaign:
            return {"error": "Campaign not found"}

        scheduled_at = campaign.get("scheduled_at")
        if scheduled_at:
            try:
                scheduled_dt = datetime.fromisoformat(str(scheduled_at).replace("Z", "+00:00"))
            except Exception:
                scheduled_dt = None
            if scheduled_dt and scheduled_dt > datetime.now(timezone.utc):
                supabase.table("campaigns").update(
                    {
                        "status": "scheduled",
                        "selected_target_ids": target_ids,
                        "ad_hoc_emails": ad_hoc_emails or [],
                    }
                ).eq("id", campaign_id).execute()
                return {
                    "message": f"Campaign '{campaign['title']}' scheduled for {scheduled_dt.isoformat()} with {len(target_ids) + len(ad_hoc_emails or [])} recipients"
                }

        # Update campaign status
        supabase.table("campaigns").update(
            {"status": "running", "selected_target_ids": target_ids, "ad_hoc_emails": ad_hoc_emails or []}
        ).eq("id", campaign_id).execute()

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
        
        # Determine channel from campaign attack_channel setting
        attack_channel = (campaign_data.get("attack_channel") or "email_link").lower()
        if attack_channel == "whatsapp" and target.get("whatsapp_number"):
            channel = "whatsapp"
        elif attack_channel == "meeting_mail":
            channel = "meeting_mail"
        elif target.get("whatsapp_number") and ("whatsapp" in desc_lower or "mobile" in desc_lower):
            channel = "whatsapp"
        else:
            channel = "email"

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
        if campaign_data.get("include_qr_code"):
            content["include_qr_code"] = True
            content["content"] = f"{content.get('content', '')}<br/><br/>[QR_CODE]<br/><br/>If the QR code does not scan, use this secure fallback link: [CLICK_HERE]"

        # Dispatch via appropriate service
        if channel == "meeting_mail":
            meeting_content = await self._build_email_attack_content(
                attack_type="meeting_mail",
                department=target.get("department", "General"),
            )
            await email_service.send_calendar_invite(target["email"], meeting_content, tracking_id)
        elif channel == "whatsapp":
            await whatsapp_service.send_message(target["whatsapp_number"], content, tracking_id)
        else:
            await email_service.send_message(target["email"], content, tracking_id)

    async def run_scheduled_campaigns(self):
        supabase = get_supabase_admin()
        now_iso = datetime.now(timezone.utc).isoformat()
        response = (
            supabase.table("campaigns")
            .select("*, templates(*)")
            .eq("status", "scheduled")
            .lte("scheduled_at", now_iso)
            .execute()
        )
        campaigns = response.data or []
        for campaign in campaigns:
            try:
                supabase.table("campaigns").update({"status": "running"}).eq("id", campaign["id"]).execute()
                selected_target_ids = campaign.get("selected_target_ids") or []
                ad_hoc_emails = campaign.get("ad_hoc_emails") or []
                if not selected_target_ids:
                    all_targets = supabase.table("targets").select("id").eq("organization_id", campaign["organization_id"]).execute()
                    selected_target_ids = [item["id"] for item in (all_targets.data or []) if item.get("id")]
                await self._dispatch_simulation(campaign, selected_target_ids, ad_hoc_emails)
            except Exception as error:
                print(f"[SCHEDULED-CAMPAIGN] Failed to dispatch {campaign.get('id')}: {error}")
                supabase.table("campaigns").update({"status": "draft"}).eq("id", campaign["id"]).execute()

campaign_service = CampaignService()
