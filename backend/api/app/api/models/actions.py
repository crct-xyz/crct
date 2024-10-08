from pydantic import BaseModel
from typing import Dict
from datetime import datetime

# Define the data model for Actions using Pydantic


class Action(BaseModel):
    action_id: int
    action_type_id: int
    user_id: str
    transaction_index: int
    transaction_type: str
    vault_id: str
    payload: Dict
