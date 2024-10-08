from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional
from app.api.models.actions import Action

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
actions_table = dynamodb.Table("actions")
users_table = dynamodb.Table("users")

# Initialize the router
router = APIRouter()

# Function to check if the user exists (simulated foreign key enforcement)


def check_user_exists(wallet_public_key: str):
    try:
        response = users_table.get_item(
            Key={"wallet_public_key": wallet_public_key})
        if "Item" not in response:
            raise HTTPException(
                status_code=404,
                detail=f"User with wallet_public_key {wallet_public_key} does not exist",
            )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


# General GET endpoint to retrieve all actions
@router.get("/", response_model=List[Action])
async def list_actions():
    try:
        response = actions_table.scan()
        return response.get("Items", [])
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


# POST endpoint to add a new action with foreign key enforcement
@router.post("/", response_model=Action)
async def create_action(action: Action):
    # Simulate foreign key enforcement
    check_user_exists(
        action.user_id
    )  # user_id in action is actually the wallet_public_key
    try:
        actions_table.put_item(
            Item=action.dict(), ConditionExpression="attribute_not_exists(action_id)"
        )
        return action
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(
                status_code=400, detail="Action with this action_id already exists"
            )
        raise HTTPException(status_code=500, detail=str(e))


# GET specific action


@router.get("/{action_id}", response_model=Dict)
async def get_action_payload(action_id: int):
    try:
        response = actions_table.get_item(Key={"action_id": action_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Action not found")
        action_item = response["Item"]
        payload = action_item.get("payload")
        if payload is None:
            raise HTTPException(status_code=404, detail="Payload not found")
        return payload
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


# PUT endpoint to update an existing action
@router.put("/{action_id}", response_model=Action)
async def update_action(action_id: int, action: Action):
    if action_id != action.action_id:
        raise HTTPException(
            status_code=400, detail="Path action_id does not match body action_id"
        )
    check_user_exists(
        action.user_id
    )  # user_id in action is actually the wallet_public_key
    try:
        response = actions_table.update_item(
            Key={"action_id": action_id},
            UpdateExpression="set action_type_id=:ati, user_id=:uid, payload=:p",
            ExpressionAttributeValues={
                ":ati": action.action_type_id,
                ":uid": action.user_id,
                ":p": action.payload,
            },
            ReturnValues="ALL_NEW",
        )
        return Action(**response["Attributes"])
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))


# DELETE endpoint to remove an action
@router.delete("/{action_id}", response_model=Dict[str, str])
async def delete_action(action_id: int):
    try:
        actions_table.delete_item(Key={"action_id": action_id})
        return {"message": f"Action with action_id {action_id} has been deleted"}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))
