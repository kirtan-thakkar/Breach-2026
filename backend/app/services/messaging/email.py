import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from app.services.messaging.base import MessagingService
from app.core.config import get_settings
from app.core.supabase import get_supabase
from datetime import datetime
from datetime import timedelta

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

    def _build_ics_content(self, title: str, tracking_link: str, tracking_id: str, organizer_email: str) -> str:
        """Build an iCalendar (.ics) invite with the tracking link embedded as the meeting URL."""
        start_dt = datetime.utcnow() + timedelta(days=1)
        start_dt = start_dt.replace(hour=10, minute=0, second=0, microsecond=0)
        end_dt = start_dt + timedelta(hours=1)
        uid = f"{tracking_id}@breach-simulation"
        dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        dtstart = start_dt.strftime("%Y%m%dT%H%M%SZ")
        dtend = end_dt.strftime("%Y%m%dT%H%M%SZ")
        safe_title = title.replace(",", "").replace(";", "").replace("\\", "\\\\").replace("\n", "\\n")
        desc = (
            "This is a mandatory security briefing. Attendance is required.\\n"
            f"Join Meeting: {tracking_link}\\n\\n"
            "Please click Accept to confirm your attendance."
        )
        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            f"DTSTART:{dtstart}",
            f"DTEND:{dtend}",
            f"DTSTAMP:{dtstamp}",
            f"ORGANIZER;CN=IT Security Team:mailto:{organizer_email}",
            f"UID:{uid}",
            f"SUMMARY:{safe_title}",
            f"DESCRIPTION:{desc}",
            f"URL:{tracking_link}",
            "STATUS:CONFIRMED",
            "CLASS:PUBLIC",
            "TRANSP:OPAQUE",
            "SEQUENCE:0",
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Meeting Reminder",
            "TRIGGER:-PT15M",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR",
        ]
        return "\r\n".join(lines)

    async def send_calendar_invite(self, target_email: str, content: dict, tracking_id: str) -> bool:
        """Send a phishing simulation disguised as a calendar/meeting invite with .ics attachment."""
        try:
            tracking_link = self.generate_tracking_link(tracking_id)
            pixel_link = self.generate_pixel_link(tracking_id)
            subject = content.get("subject", "Mandatory Security Briefing – Meeting Invite")

            start_dt = datetime.utcnow() + timedelta(days=1)
            start_dt = start_dt.replace(hour=10, minute=0, second=0, microsecond=0)
            date_label = start_dt.strftime("%B %d, %Y at %I:%M %p UTC")

            # HTML email body
            body = (
                f'<div style="font-family:\'Segoe UI\',Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">'
                f'<div style="background:#0078d4;color:white;padding:16px 20px;border-radius:4px 4px 0 0;">'
                f'<h2 style="margin:0;font-size:18px;">&#128197; {subject}</h2>'
                f'</div>'
                f'<div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 4px 4px;">'
                f'<p style="color:#333;font-size:14px;">You have been invited to a mandatory security meeting.</p>'
                f'<p style="color:#333;font-size:14px;"><strong>Date:</strong> {date_label}</p>'
                f'<p style="color:#333;font-size:14px;"><strong>Duration:</strong> 1 hour</p>'
                f'<div style="margin:20px 0;text-align:center;">'
                f'<a href="{tracking_link}" style="background:#0078d4;color:white;padding:12px 28px;'
                f'text-decoration:none;border-radius:4px;font-size:14px;display:inline-block;">&#128279; Join Meeting</a>'
                f'</div>'
                f'<p style="color:#666;font-size:12px;">A calendar invite is attached below. '
                f'Click <b>Accept</b> in your calendar app to confirm attendance.</p>'
                f'</div></div>'
                f'<img src="{pixel_link}" width="1" height="1" style="display:none;" />'
            )

            ics_content = self._build_ics_content(
                title=subject,
                tracking_link=tracking_link,
                tracking_id=tracking_id,
                organizer_email=self.from_email,
            )

            msg = MIMEMultipart("mixed")
            msg["From"] = self.from_email
            msg["To"] = target_email
            msg["Subject"] = subject

            alt_part = MIMEMultipart("alternative")
            alt_part.attach(MIMEText(body, "html"))
            msg.attach(alt_part)

            ics_part = MIMEBase("text", "calendar", method="REQUEST", name="invite.ics")
            ics_part.set_payload(ics_content.encode("utf-8"))
            encoders.encode_base64(ics_part)
            ics_part.add_header("Content-Disposition", "attachment", filename="invite.ics")
            ics_part.add_header("Content-Class", "urn:content-classes:calendarmessage")
            msg.attach(ics_part)

            if self.smtp_user and self.smtp_password:
                with smtplib.SMTP(str(self.smtp_server), int(self.smtp_port)) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(str(self.smtp_user), str(self.smtp_password))
                    server.send_message(msg)
                print(f"[CALENDAR] Successfully sent calendar invite to {target_email}")
            else:
                print(f"[CALENDAR-DRY-RUN] SMTP credentials missing. Simulating calendar invite to {target_email}")
                print(f"  Subject: {subject}")
                print(f"  Meeting Link: {tracking_link}")

            await self.log_delivery(tracking_id, True)
            return True
        except Exception as e:
            print(f"[CALENDAR-ERROR] Failed to send calendar invite to {target_email}: {e}")
            await self.log_delivery(tracking_id, False, str(e))
            return False

email_service = EmailService()
