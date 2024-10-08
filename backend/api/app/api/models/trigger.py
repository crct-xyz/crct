from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EventTrigger(BaseModel):
    trigger_id: int = Field(..., description="Unique identifier for the trigger")
    event_type: str = Field(..., description="Type of the event")
    description: Optional[str] = Field(
        None, description="Description of the event trigger"
    )
