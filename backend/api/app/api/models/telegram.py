from pydantic import BaseModel


class TelegramSession(BaseModel):
    telegram_user: str
    session_id: int
