from pydantic import BaseModel
from typing import Dict, Optional


class ActionEvent(BaseModel):
    event_type: str
    details: Dict


class Order(BaseModel):
    order_id: str
    app: str
    action_event: ActionEvent
    user_id: str
    timestamp: Optional[int] = None
