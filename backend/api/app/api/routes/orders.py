from fastapi import APIRouter, HTTPException
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List
import time
from app.api.models.orders import Order
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
orders_table = dynamodb.Table("orders")
users_table = dynamodb.Table("users")

# Initialize the router
router = APIRouter()


def check_requestee_exists(requestee):
    try:
        response = users_table.query(
            IndexName="telegram_username-index",
            KeyConditionExpression=Key("telegram_username").eq(requestee),
        )
        return len(response.get("Items", [])) > 0
    except ClientError as e:
        print(f"Error checking user existence: {e}")
        return False


@router.post("/", response_model=Order)
def create_order(order: Order):
    if order.timestamp is None:
        order.timestamp = int(time.time())

    if order.app == "USDC":
        details = order.action_event.details
        requestee = details.get("telegram_username")
        print(requestee)
        if not requestee:
            raise HTTPException(
                status_code=400, detail="Telegram username is required for USDC orders"
            )

        if not check_requestee_exists(requestee):
            raise HTTPException(
                status_code=404, detail="Requestee is not a registered user"
            )

        amount = details.get("amount")
        currency = details.get("currency")
        if not amount or not currency:
            raise HTTPException(
                status_code=400,
                detail="Amount and currency are required for USDC orders",
            )

    try:
        orders_table.put_item(Item=order.dict())
        return order
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.get("/{order_id}", response_model=Order)
def get_order(order_id: str):
    try:
        response = orders_table.get_item(Key={"order_id": order_id})
        item = response.get("Item")
        if not item:
            raise HTTPException(
                status_code=404, detail=f"Order with ID {order_id} not found"
            )
        return Order(**item)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve order: {str(e)}"
        )


@router.get("/", response_model=List[Order])
def list_orders():
    try:
        response = orders_table.scan()
        items = response.get("Items", [])
        return [Order(**item) for item in items]
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to list orders: {str(e)}")


@router.delete("/{order_id}", response_model=Dict[str, str])
def delete_order(order_id: str):
    try:
        orders_table.delete_item(Key={"order_id": order_id})
        return {"message": f"Order with ID {order_id} deleted successfully"}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete order: {str(e)}")


@router.put("/{order_id}", response_model=Order)
def update_order(order_id: str, order: Order):
    if order.order_id != order_id:
        raise HTTPException(
            status_code=400, detail="Order ID in path must match Order ID in body"
        )

    try:
        response = orders_table.put_item(Item=order.dict())
        return order
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to update order: {str(e)}")
