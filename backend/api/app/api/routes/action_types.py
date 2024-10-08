from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from typing import List, Dict, Optional
from app.api.models.action_types import ActionType

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
actions_table = dynamodb.Table("action_types")

# Initialize the router
router = APIRouter()


# Create a new ActionType
@router.post("/", response_model=ActionType)
async def create_action_type(action_type: ActionType):
    try:
        actions_table.put_item(
            Item=action_type.dict(), ConditionExpression="attribute_not_exists(type_id)"
        )
        return action_type
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(
                status_code=400, detail="ActionType with this type_id already exists"
            )
        raise HTTPException(
            status_code=500, detail="An error occurred while creating the ActionType"
        )


# Get an ActionType by type_id
@router.get("/{type_id}", response_model=ActionType)
async def get_action_type(type_id: int):
    try:
        response = actions_table.get_item(Key={"type_id": type_id})
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="ActionType not found")
        return ActionType(**response["Item"])
    except ClientError:
        raise HTTPException(
            status_code=500, detail="An error occurred while retrieving the ActionType"
        )


# Update an existing ActionType
@router.put("/{type_id}", response_model=ActionType)
async def update_action_type(type_id: int, action_type: ActionType):
    if type_id != action_type.type_id:
        raise HTTPException(
            status_code=400, detail="Path type_id does not match body type_id"
        )
    try:
        response = actions_table.update_item(
            Key={"type_id": type_id},
            UpdateExpression="set business_name=:bn, contract_name=:cn, description=:d, json=:j",
            ExpressionAttributeValues={
                ":bn": action_type.business_name,
                ":cn": action_type.contract_name,
                ":d": action_type.description,
                ":j": action_type.json,
            },
            ReturnValues="ALL_NEW",
        )
        return ActionType(**response["Attributes"])
    except ClientError:
        raise HTTPException(
            status_code=500, detail="An error occurred while updating the ActionType"
        )


# Delete an ActionType
@router.delete("/{type_id}", response_model=Dict[str, str])
async def delete_action_type(type_id: int):
    try:
        actions_table.delete_item(Key={"type_id": type_id})
        return {"message": f"ActionType with type_id {type_id} has been deleted"}
    except ClientError:
        raise HTTPException(
            status_code=500, detail="An error occurred while deleting the ActionType"
        )


# List all ActionTypes
@router.get("/", response_model=List[ActionType])
async def list_action_types():
    try:
        response = actions_table.scan()
        return [ActionType(**item) for item in response["Items"]]
    except ClientError:
        raise HTTPException(
            status_code=500, detail="An error occurred while retrieving ActionTypes"
        )
