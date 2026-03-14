from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.services.rag_service import rag_service
from typing import Optional

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    user_email: Optional[str] = None # Optional user email for tailored guidance

class ChatResponse(BaseModel):
    reply: str

@router.post("/ask", response_model=ChatResponse)
async def ask_chatbot(payload: ChatRequest):
    # The chatbot now takes user_email to fetch their simulation history
    # and explain their specific mistakes.
    reply = await rag_service.ask(
        session_id=payload.session_id, 
        question=payload.message,
        user_email=payload.user_email
    )
    return {"reply": reply}
