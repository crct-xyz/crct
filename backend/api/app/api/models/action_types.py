from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class ActionType(BaseModel):
    type_id: int
    business_name: Optional[str] = None
    contract_name: Optional[str] = None
    description: Optional[str] = None
    json: Optional[Dict] = None
