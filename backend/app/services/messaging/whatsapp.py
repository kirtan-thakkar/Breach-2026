import os
import httpx
import urllib.parse
from app.services.messaging.base import MessagingService
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()

class WhatsAppService(MessagingService):
    def __init__(self):
        self.api_key = os.getenv("WHATSAPP_API_KEY", "mock_key")
        self.sender_number = os.getenv("WHATSAPP_SENDER", "1234567890")
        self.base_url = (os.getenv("API_BASE_URL") or settings.APP_BASE_URL or "http://localhost:8000").rstrip("/")
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_from = os.getenv("TWILIO_WHATSAPP_FROM")
        self.meta_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.meta_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.send_mode = (os.getenv("WHATSAPP_SEND_MODE") or "uri").lower()

    def generate_tracking_link(self, tracking_id: str) -> str:
        return f"{self.base_url}/api/v1/tracking/click/{tracking_id}"

    def _normalize_phone(self, phone: str) -> str:
        return "".join(ch for ch in str(phone) if ch.isdigit())

    def generate_message_uri(self, target_phone: str, message_body: str) -> str:
        normalized = self._normalize_phone(target_phone)
        encoded_text = urllib.parse.quote(message_body, safe="")
        return f"https://wa.me/{normalized}?text={encoded_text}"

    async def _send_via_twilio(self, to_phone: str, message_body: str) -> bool:
        if not (self.twilio_sid and self.twilio_token and self.twilio_from):
            return False
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.twilio_sid}/Messages.json"
        payload = {
            "From": self.twilio_from,
            "To": f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone,
            "Body": message_body,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, data=payload, auth=(self.twilio_sid, self.twilio_token))
        if response.status_code >= 300:
            raise RuntimeError(f"Twilio WhatsApp error: {response.status_code} {response.text}")
        return True

    async def _send_via_meta_cloud(self, to_phone: str, message_body: str) -> bool:
        if not (self.meta_token and self.meta_phone_number_id):
            return False
        url = f"https://graph.facebook.com/v20.0/{self.meta_phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "text",
            "text": {"preview_url": True, "body": message_body},
        }
        headers = {
            "Authorization": f"Bearer {self.meta_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, json=payload, headers=headers)
        if response.status_code >= 300:
            raise RuntimeError(f"Meta WhatsApp error: {response.status_code} {response.text}")
        return True

    async def send_message(self, target_phone: str, content: dict, tracking_id: str):
        try:
            tracking_link = self.generate_tracking_link(tracking_id)
            message_body = content.get("content", "").replace("[CLICK_HERE]", tracking_link)
            whatsapp_uri = self.generate_message_uri(target_phone, message_body)

            delivered = False
            if self.send_mode == "api" and self.twilio_sid and self.twilio_token and self.twilio_from:
                delivered = await self._send_via_twilio(target_phone, message_body)
                print(f"[WHATSAPP] Sent via Twilio to {target_phone}")
            elif self.send_mode == "api" and self.meta_token and self.meta_phone_number_id:
                delivered = await self._send_via_meta_cloud(target_phone, message_body)
                print(f"[WHATSAPP] Sent via Meta Cloud API to {target_phone}")
            else:
                # Default no-config mode: provide wa.me URI for direct WhatsApp send.
                print(f"[WHATSAPP-URI] Open this URI to send message:")
                print(whatsapp_uri)
                print(f"[WHATSAPP-URI] Tracking link embedded: {tracking_link}")
                delivered = True
            
            await self.log_delivery(tracking_id, delivered)
            return delivered
        except Exception as e:
            print(f"[WHATSAPP-ERROR] Dispatch failed: {e}")
            await self.log_delivery(tracking_id, False, str(e))
            return False

    async def log_delivery(self, tracking_id: str, success: bool, error: str = None):
        try:
            from app.core.supabase import get_supabase
            supabase = get_supabase()
            supabase.table("simulations").update({
                "email_sent": success,
                "sent_at": datetime.utcnow().isoformat() if success else None,
                "channel": "whatsapp"
            }).eq("tracking_id", tracking_id).execute()
        except Exception as e:
            print(f"[WHATSAPP-LOG] Error logging delivery: {e}")

whatsapp_service = WhatsAppService()
