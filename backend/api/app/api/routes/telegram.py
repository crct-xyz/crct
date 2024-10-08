from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional
from app.api.models.telegram import TelegramSession

# Initialize DynamoDB client
# Replace with your AWS region
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
telegram_sessions_table = dynamodb.Table("telegram_sessions")

# Initialize the router
router = APIRouter()


@router.post("/", response_model=TelegramSession)
def create_telegram_session(tsesh: TelegramSession):
    item = {
        "telegram_user": tsesh.telegram_user,
        "session_id": tsesh.session_id,
    }
    try:
        telegram_sessions_table.put_item(Item=item)
        return tsesh
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create session: {str(e)}"
        )


@router.get("/{telegram_user}", response_model=TelegramSession)
def read_telegram_user(telegram_user: str):
    try:
        response = telegram_sessions_table.get_item(
            Key={"telegram_user": telegram_user}
        )
        item = response.get("Item")
        if not item:
            raise HTTPException(
                status_code=404, detail=f"Session not found for user: {telegram_user}"
            )
        return TelegramSession(**item)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve session: {str(e)}"
        )


@router.get("/", response_model=List[TelegramSession])
def list_telegram_sessions():
    try:
        response = telegram_sessions_table.scan()
        items = response.get("Items", [])
        return [TelegramSession(**item) for item in items]
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list sessions: {str(e)}"
        )


@router.delete("/{telegram_user}", response_model=Dict[str, str])
def delete_telegram_session(telegram_user: str):
    try:
        # Check if the session exists
        response = telegram_sessions_table.get_item(
            Key={"telegram_user": telegram_user}
        )
        if not response.get("Item"):
            raise HTTPException(
                status_code=404, detail=f"Session not found for user: {telegram_user}"
            )

        # Delete the session
        telegram_sessions_table.delete_item(Key={"telegram_user": telegram_user})
        return {"message": f"Session for user {telegram_user} deleted successfully"}
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete session: {str(e)}"
        )
