import os
from typing import Optional
from dotenv import load_dotenv
from app.core.supabase import get_supabase
from app.langchain.rag import rag_engine

load_dotenv()

class RAGService:
    def __init__(self, pdf_path: Optional[str] = None):
        self.pdf_path = pdf_path or os.getenv("RAG_PDF_PATH", "backend/app/langchain/lang.pdf")

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

    async def ask(self, session_id: str, question: str, user_email: Optional[str] = None):
        """
        Ask a question, optionally including the user's specific simulation history.
        """
        if not rag_engine.is_ready:
            return "I'm sorry, my knowledge base is currently offline. Please try again later."

        user_context = ""
        if user_email:
            try:
                events = self._load_user_history_events(user_email=user_email)
                user_context = rag_engine.build_user_history_context(events)
            except Exception as error:
                print(f"Error fetching user history for AI: {error}")

        try:
            return rag_engine.ask(
                question=question,
                session_id=session_id,
                user_context=user_context,
            )
        except Exception as error:
            print(f"Error in RAG ask: {error}")
            return "I encountered an error while processing your request."

rag_service = RAGService()
