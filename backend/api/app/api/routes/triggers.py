from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.api.models.trigger import EventTrigger
from botocore.exceptions import ClientError
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Initialize DynamoDB resource
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
event_triggers_table = dynamodb.Table("triggers")

router = APIRouter()


@router.post("/", response_model=EventTrigger, status_code=201)
def create_event_trigger(event: EventTrigger):
    item = {
        "trigger_id": event.trigger_id,
        "event_type": event.event_type,
    }
    try:
        event_triggers_table.put_item(Item=item)
        return event
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create event trigger: {str(e)}"
        )


@router.get("/{trigger_id}/{event_type}", response_model=EventTrigger)
def read_event_trigger(trigger_id: int, event_type: str):
    try:
        response = event_triggers_table.get_item(
            Key={"trigger_id": trigger_id, "event_type": event_type}
        )
        item = response.get("Item")
        if not item:
            raise HTTPException(
                status_code=404,
                detail=f"Event trigger not found for trigger_id: {trigger_id} and event_type: {event_type}",
            )
        return EventTrigger(**item)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve event trigger: {str(e)}"
        )


@router.get("/", response_model=List[EventTrigger])
def list_event_triggers():
    try:
        response = event_triggers_table.scan()
        items = response.get("Items", [])
        return [EventTrigger(**item) for item in items]
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to list event triggers: {str(e)}"
        )


@router.put("/{trigger_id}/{event_type}", response_model=EventTrigger)
def update_event_trigger(trigger_id: int, event_type: str, updated_event: EventTrigger):
    if trigger_id != updated_event.trigger_id or event_type != updated_event.event_type:
        raise HTTPException(
            status_code=400,
            detail="trigger_id and event_type in the path must match the payload",
        )

    try:
        response = event_triggers_table.update_item(
            Key={"trigger_id": trigger_id, "event_type": event_type},
            UpdateExpression="set description = :d, created_at = :c",
            ExpressionAttributeValues={
                ":d": updated_event.description,
                ":c": updated_event.created_at.isoformat(),
            },
            ReturnValues="ALL_NEW",
        )
        updated_item = response.get("Attributes")
        if not updated_item:
            raise HTTPException(
                status_code=404,
                detail=f"Event trigger not found for trigger_id: {trigger_id} and event_type: {event_type}",
            )
        return EventTrigger(**updated_item)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update event trigger: {str(e)}"
        )


@router.delete("/{trigger_id}/{event_type}", status_code=204)
def delete_event_trigger(trigger_id: str, event_type: str):
    try:
        response = event_triggers_table.delete_item(
            Key={"trigger_id": trigger_id, "event_type": event_type},
            ConditionExpression="attribute_exists(trigger_id) AND attribute_exists(event_type)",
        )
        return
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise HTTPException(
                status_code=404,
                detail=f"Event trigger not found for trigger_id: {trigger_id} and event_type: {event_type}",
            )
        else:
            raise HTTPException(
                status_code=500, detail=f"Failed to delete event trigger: {str(e)}"
            )
