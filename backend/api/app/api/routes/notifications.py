from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='eu-central-1')  # Replace with your AWS region
notifications_table = dynamodb.Table('notifications')
users_table = dynamodb.Table('users')  # Reference for foreign key enforcement on user_id
actions_table = dynamodb.Table('actions')  # Reference for foreign key enforcement on action_id

# Initialize the router
router = APIRouter()

# Define the data model for Notifications using Pydantic
class Notification(BaseModel):
    notification_id: int
    action_id: int
    blink_url: str
    sent: bool
    timestamp: str
    user_id: int

# Function to check if the user exists (simulated foreign key enforcement)
def check_user_exists(user_id: int):
    try:
        response = users_table.get_item(Key={"user_id": user_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail=f"User with user_id {user_id} does not exist")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

# Function to check if the action exists (simulated foreign key enforcement)
def check_action_exists(action_id: int):
    try:
        response = actions_table.get_item(Key={"action_id": action_id})
        if 'Item' not in response:
            raise HTTPException(status_code=404, detail=f"Action with action_id {action_id} does not exist")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

# General GET endpoint to retrieve all notifications
@router.get("/", response_model=List[Dict])
def list_notifications():
    try:
        response = notifications_table.scan()
        items = response.get('Items')
        return items
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

# POST endpoint to add a new notification with foreign key enforcement
@router.post("/", response_model=Notification)
def create_notification(notification: Notification):
    # Simulate foreign key enforcement
    check_user_exists(notification.user_id)
    check_action_exists(notification.action_id)

    try:
        # Prepare the item to insert into DynamoDB
        notifications_table.put_item(
            Item={
                "notification_id": {"N": str(notification.notification_id)},
                "action_id": {"N": str(notification.action_id)},
                "blink_url": {"S": notification.blink_url},
                "sent": {"BOOL": notification.sent},
                "timestamp": {"S": notification.timestamp},
                "user_id": {"N": str(notification.user_id)},
            }
        )
        return notification
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))
