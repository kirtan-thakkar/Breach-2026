import asyncio
import logging
import random
import smtplib
from email.message import EmailMessage
from typing import Any, Dict, List

from app.core.config import get_settings

class EmailService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.logger = logging.getLogger("app.services.email")

    async def send_simulation_emails(self, campaign_id: str, simulation_links: List[Dict[str, str]]) -> Dict[str, Any]:
        self._validate_runtime_config()
        self.logger.info("Starting email campaign", extra={"campaign_id": campaign_id, "targets": len(simulation_links)})

        semaphore = asyncio.Semaphore(max(1, self.settings.EMAIL_BATCH_CONCURRENCY))
        tasks = [self._send_one_simulation_email(semaphore, campaign_id, item) for item in simulation_links]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        success_count = 0
        failed_count = 0
        failures: List[Dict[str, str]] = []

        for result in results:
            if isinstance(result, Exception):
                failed_count += 1
                failures.append({"email": "unknown", "error": str(result)})
                continue

            if result["status"] == "sent" or result["status"] == "dry_run":
                success_count += 1
            else:
                failed_count += 1
                failures.append({"email": result["email"], "error": result["error"]})

        summary = {
            "campaign_id": campaign_id,
            "total": len(simulation_links),
            "sent": success_count,
            "failed": failed_count,
            "dry_run": self.settings.EMAIL_DRY_RUN,
            "failures": failures,
        }
        self.logger.info("Email campaign finished", extra=summary)
        return summary

    async def _send_one_simulation_email(
        self,
        semaphore: asyncio.Semaphore,
        campaign_id: str,
        payload: Dict[str, str],
    ) -> Dict[str, str]:
        async with semaphore:
            receiver = payload.get("email")
            track_link = payload.get("link")
            if not receiver or not track_link:
                return {
                    "status": "failed",
                    "email": receiver or "unknown",
                    "error": "Missing required simulation payload keys: email and link",
                }

            subject = payload.get("subject") or "Security Action Required"
            target_name = payload.get("name") or "there"
            html_body = self._render_default_html(target_name=target_name, tracking_link=track_link)
            text_body = self._render_default_text(target_name=target_name, tracking_link=track_link)

            return await self.send_email(
                to_email=receiver,
                subject=subject,
                html_body=html_body,
                text_body=text_body,
                metadata={"campaign_id": campaign_id},
            )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        metadata: Dict[str, str] | None = None,
    ) -> Dict[str, str]:
        if self.settings.EMAIL_DRY_RUN:
            self.logger.info(
                "Dry run email",
                extra={"to": to_email, "subject": subject, "metadata": metadata or {}},
            )
            return {"status": "dry_run", "email": to_email, "error": ""}

        message = self._build_message(to_email, subject, html_body, text_body)
        return await self._send_with_retries(to_email, message)

    async def _send_with_retries(self, to_email: str, message: EmailMessage) -> Dict[str, str]:
        max_attempts = max(1, self.settings.EMAIL_MAX_RETRIES)
        for attempt in range(1, max_attempts + 1):
            try:
                await asyncio.to_thread(self._send_via_smtp_blocking, message)
                self.logger.info("Email delivered", extra={"to": to_email, "attempt": attempt})
                return {"status": "sent", "email": to_email, "error": ""}
            except Exception as exc:
                self.logger.warning(
                    "Email delivery failed",
                    extra={"to": to_email, "attempt": attempt, "max_attempts": max_attempts, "error": str(exc)},
                )
                if attempt >= max_attempts:
                    return {"status": "failed", "email": to_email, "error": str(exc)}

                base = max(0.1, self.settings.EMAIL_BASE_RETRY_SECONDS)
                delay_seconds = (base * (2 ** (attempt - 1))) + random.uniform(0, 0.2)
                await asyncio.sleep(delay_seconds)

        return {"status": "failed", "email": to_email, "error": "Unknown send failure"}

    def _send_via_smtp_blocking(self, message: EmailMessage) -> None:
        host = self.settings.SMTP_HOST
        port = self.settings.SMTP_PORT
        timeout_seconds = self.settings.SMTP_TIMEOUT_SECONDS
        username = self.settings.SMTP_USERNAME
        password = self.settings.SMTP_PASSWORD

        if self.settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(host=host, port=port, timeout=timeout_seconds) as smtp:
                if username and password:
                    smtp.login(username, password)
                smtp.send_message(message)
            return

        with smtplib.SMTP(host=host, port=port, timeout=timeout_seconds) as smtp:
            smtp.ehlo()
            if self.settings.SMTP_USE_TLS:
                smtp.starttls()
                smtp.ehlo()

            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)

    def _build_message(self, to_email: str, subject: str, html_body: str, text_body: str) -> EmailMessage:
        from_display = f"{self.settings.EMAIL_FROM_NAME} <{self.settings.EMAIL_FROM_ADDRESS}>"
        message = EmailMessage()
        message["From"] = from_display
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(text_body)
        message.add_alternative(html_body, subtype="html")
        return message

    def _validate_runtime_config(self) -> None:
        if not self.settings.EMAIL_ENABLED:
            raise RuntimeError("Email delivery is disabled. Set EMAIL_ENABLED=true to send emails.")

        if self.settings.EMAIL_DRY_RUN:
            return

        missing = []
        if not self.settings.SMTP_HOST:
            missing.append("SMTP_HOST")
        if not self.settings.SMTP_PORT:
            missing.append("SMTP_PORT")
        if not self.settings.EMAIL_FROM_ADDRESS:
            missing.append("EMAIL_FROM_ADDRESS")

        if missing:
            raise RuntimeError(f"Missing required email settings: {', '.join(missing)}")

    @staticmethod
    def _render_default_text(target_name: str, tracking_link: str) -> str:
        return (
            f"Hi {target_name},\n\n"
            "A mandatory security action is required on your account.\n"
            f"Please complete this process here: {tracking_link}\n\n"
            "If you were not expecting this message, contact your security team."
        )

    @staticmethod
    def _render_default_html(target_name: str, tracking_link: str) -> str:
        return f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; line-height: 1.6;\">
                <p>Hi {target_name},</p>
                <p>A mandatory security action is required on your account.</p>
                <p>
                    <a href=\"{tracking_link}\" style=\"display:inline-block;padding:10px 16px;background:#0b57d0;color:#fff;text-decoration:none;border-radius:4px;\">
                        Complete Verification
                    </a>
                </p>
                <p>If you were not expecting this message, contact your security team.</p>
            </body>
        </html>
        """.strip()

email_service = EmailService()
