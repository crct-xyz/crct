from pydantic import BaseModel, Field
from typing import Optional


class UserBase(BaseModel):
    wallet_public_key: str = Field(..., description="User's public wallet key")
    telegram_username: str = Field(..., description="User's unique Telegram username")


class UserResponse(BaseModel):
    wallet_public_key: Optional[str] = Field(
        None, description="User's public wallet key"
    )
    telegram_username: Optional[str] = Field(
        None, description="User's unique Telegram username"
    )
    is_registered: bool = Field(..., description="User registration status")


class UserCreate(UserBase):
    pass  # No additional fields needed


class User(UserBase):
    is_registered: bool = Field(..., description="User registration status")
    created_at: str = Field(..., description="Timestamp of user creation")
    updated_at: str = Field(..., description="Timestamp of last user update")


class UserUpdate(BaseModel):
    telegram_username: Optional[str] = Field(
        None, description="User's unique Telegram username"
    )
