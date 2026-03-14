import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.services.messaging.base import MessagingService
from app.core.config import get_settings
from app.core.supabase import get_supabase
from datetime import datetime

settings = get_settings()

class EmailService(MessagingService):
    def __init__(self):
        # Read from all possible env var names for compatibility
        self.smtp_server = os.getenv("SMTP_SERVER") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME") or ""
        self.smtp_password = os.getenv("SMTP_PASSWORD") or ""
        self.from_email = os.getenv("FROM_EMAIL") or self.smtp_user or "security@attacksim.com"

    def generate_tracking_link(self, tracking_id: str) -> str:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        return f"{base_url}/api/v1/tracking/click/{tracking_id}"

    def generate_pixel_link(self, tracking_id: str) -> str:
        base_url = os.getenv("API_BASE_URL", "http://localhost:8000")
        return f"{base_url}/api/v1/tracking/open/{tracking_id}"

    def generate_qr_image_url(self, destination_url: str) -> str:
        from urllib.parse import quote

        return f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote(destination_url, safe='')}"

    async def send_message(self, target_email: str, content: dict, tracking_id: str):
        try:
            tracking_link = self.generate_tracking_link(tracking_id)
            pixel_link = self.generate_pixel_link(tracking_id)
            
            # Replace placeholder with actual link
            body = content.get("content", "").replace("[CLICK_HERE]", tracking_link)
            qr_markup = (
                f'<div style="margin:20px 0;text-align:center;">'
                f'<img src="{self.generate_qr_image_url(tracking_link)}" alt="QR Code" width="180" height="180" />'
                f'<p style="font-size:12px;color:#475569;margin-top:8px;">Scan to open the same secure link</p>'
                f'</div>'
            )
            if "[QR_CODE]" in body:
                body = body.replace("[QR_CODE]", qr_markup)
            elif content.get("include_qr_code"):
                body += f"<br/><br/>{qr_markup}"
            # Add tracking pixel
            body += f'<img src="{pixel_link}" width="1" height="1" style="display:none;" />'

            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = target_email
            msg['Subject'] = content.get("subject", "Security Awareness Update")

            msg.attach(MIMEText(body, 'html'))

            if self.smtp_user and self.smtp_password:
                with smtplib.SMTP(str(self.smtp_server), int(self.smtp_port)) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(str(self.smtp_user), str(self.smtp_password))
                    server.send_message(msg)
                print(f"[EMAIL] Successfully sent to {target_email}")
            else:
                print(f"[EMAIL-DRY-RUN] SMTP credentials missing. Simulating send to {target_email}")
                print(f"  Subject: {msg['Subject']}")

            await self.log_delivery(tracking_id, True)
            return True
        except Exception as e:
            print(f"[EMAIL-ERROR] Failed to send email to {target_email}: {e}")
            await self.log_delivery(tracking_id, False, str(e))
            return False

    async def log_delivery(self, tracking_id: str, success: bool, error: str = None):
        try:
            supabase = get_supabase()
            data = {
                "email_sent": success,
                "sent_at": datetime.utcnow().isoformat() if success else None
            }
            supabase.table("simulations").update(data).eq("tracking_id", tracking_id).execute()
        except Exception as e:
            print(f"[EMAIL-LOG] Error logging delivery: {e}")

email_service = EmailService()
