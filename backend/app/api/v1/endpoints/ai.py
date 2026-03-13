from fastapi import APIRouter, HTTPException
from app.services.ai_service import ai_service
from app.services.ml_service import ml_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class PhishingRequest(BaseModel):
    context: str
    department: Optional[str] = "General"

class RiskRequest(BaseModel):
    opened: int
    clicked: int
    submitted: int

@router.post("/generate-template")
async def generate_template(request: PhishingRequest):
    try:
        content = await ai_service.generate_phishing_content(request.context, request.department)
        return content
    except Exception:
        raise HTTPException(status_code=500, detail="Template generation failed")

@router.post("/predict-risk")
async def predict_risk(request: RiskRequest):
    stats = {
        'email_opened': request.opened,
        'link_clicked': request.clicked,
        'form_submitted': request.submitted
    }
    score = ml_service.predict_risk_score(stats)
    
    risk_level = "low"
    if score > 0.7: risk_level = "high"
    elif score > 0.4: risk_level = "medium"
    
    return {
        "risk_score": score,
        "risk_level": risk_level
    }

@router.post("/summarize-insights")
async def summarize_insights(risk_score: float, department: str):
    if not ai_service.model:
        return {"recommendation": "Maintain standard security training."}
    
    prompt = f"""
    A user in the {department} department has a risk score of {risk_score:.2f} (0.0 to 1.0).
    Provide a brief, actionable recommendation for the security team to help this user.
    """
    try:
        response = ai_service.model.generate_content(prompt)
        return {"recommendation": response.text}
    except Exception:
        return {"recommendation": "Scheduled manual security review recommended."}
