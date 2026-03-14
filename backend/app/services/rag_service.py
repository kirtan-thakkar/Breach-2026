from typing import Optional

from app.core.supabase import get_supabase


class RAGService:
    """Lightweight chat guidance service with no external RAG dependency."""

    def _load_user_history_events(self, user_email: str):
        supabase = get_supabase()
        target = supabase.table("targets").select("id").eq("email", user_email).execute()

        if not target.data:
            return []

        target_ids = [entry["id"] for entry in target.data if entry.get("id")]
        if not target_ids:
            return []

        sims = supabase.table("simulations").select("id").in_("target_id", target_ids).execute()
        simulation_ids = [entry["id"] for entry in (sims.data or []) if entry.get("id")]

        if not simulation_ids:
            return []

        events = (
            supabase.table("simulation_events")
            .select("event_type, created_at")
            .in_("simulation_id", simulation_ids)
            .execute()
        )
        return events.data or []

    def _build_summary(self, events: list[dict]) -> str:
        opened = sum(1 for event in events if event.get("event_type") == "email_opened")
        clicked = sum(1 for event in events if event.get("event_type") == "link_clicked")
        submitted = sum(1 for event in events if event.get("event_type") == "credential_submitted")

        if not events:
            return "No simulation history found yet."

        return (
            f"Simulation history summary: {opened} opens, {clicked} link clicks, "
            f"{submitted} credential submissions."
        )

    async def ask(self, session_id: str, question: str, user_email: Optional[str] = None):
        """Return practical awareness guidance without external RAG engines."""
        _ = session_id  # Reserved for future conversation state support.

        tips = [
            "Always verify sender domain and reply-to mismatch before trusting urgent requests.",
            "Hover links and verify full destination URL before clicking.",
            "Never submit credentials from an email link; open the trusted app/site manually.",
            "Report suspicious messages to your security team immediately.",
        ]

        question_text = (question or "").strip()
        if not question_text:
            question_text = "How can I avoid phishing attacks?"

        user_summary = ""
        if user_email:
            try:
                events = self._load_user_history_events(user_email=user_email)
                user_summary = self._build_summary(events)
            except Exception as error:
                print(f"Error fetching user history for chat assistant: {error}")

        guidance = (
            "Security Assistant\n"
            f"Question: {question_text}\n\n"
            "Top recommendations:\n"
            f"1. {tips[0]}\n"
            f"2. {tips[1]}\n"
            f"3. {tips[2]}\n"
            f"4. {tips[3]}"
        )

        if user_summary:
            guidance = f"{guidance}\n\n{user_summary}"

        return guidance

rag_service = RAGService()
