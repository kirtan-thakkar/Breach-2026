from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CampaignType(str, Enum):
    PHISHING = "phishing"
    CREDENTIAL_HARVESTING = "credential_harvesting"
    MALWARE_DECEPTION = "malware_deception"
    SOCIAL_ENGINEERING = "social_engineering"

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TargetBase(BaseModel):
    email: EmailStr
    name: str
    department: Optional[str] = None
    organization_id: str

class TargetCreate(TargetBase):
    pass

class Target(TargetBase):
    id: str
    risk_index: float = 0.0
    behavioral_tags: List[str] = Field(default_factory=list)
    created_at: datetime
    
    class Config:
        from_attributes = True

class CampaignBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: CampaignType
    template_id: str
    organization_id: str

class CampaignCreate(CampaignBase):
    scheduled_at: Optional[datetime] = None

class Campaign(CampaignBase):
    id: str
    status: CampaignStatus
    created_at: datetime
    scheduled_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class EventType(str, Enum):
    EMAIL_OPENED = "email_opened"
    LINK_CLICKED = "link_clicked"
    FORM_SUBMITTED = "form_submitted"
    DATA_ENTERED = "data_entered"

class SimulationEventCreate(BaseModel):
    simulation_id: str
    event_type: EventType
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[dict] = None

class SimulationEvent(SimulationEventCreate):
    id: str
    created_at: datetime
class TemplateBase(BaseModel):
    name: str
    type: str
    subject: str
    content: str
    is_ai_generated: bool = False
    ai_prompt_context: Optional[dict] = None

class Template(TemplateBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
