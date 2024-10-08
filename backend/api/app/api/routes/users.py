from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
import boto3
from botocore.exceptions import ClientError
from typing import List, Optional
from datetime import datetime
from app.api.models.users import User, UserResponse, UserCreate, UserUpdate

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name="eu-central-1")
users_table = dynamodb.Table("users")

# Initialize the router
router = APIRouter()


def get_users_table():
    return users_table


def format_user(user):
    return {
        "wallet_public_key": user["wallet_public_key"],
        "telegram_username": user.get("telegram_username"),
        "is_registered": user.get("is_registered", False),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


# Create or update a user


@router.post("/", response_model=User, status_code=201)
async def create_or_update_user(user_input: UserCreate, table=Depends(get_users_table)):
    try:
        # Check if the user already exists
        response = table.get_item(
            Key={"wallet_public_key": user_input.wallet_public_key}
        )
        existing_user = response.get("Item")

        if existing_user:
            # User exists
            is_registered = existing_user.get("is_registered", False)
            if not is_registered:
                # Update is_registered to True and update telegram_username
                table.update_item(
                    Key={"wallet_public_key": user_input.wallet_public_key},
                    UpdateExpression="SET is_registered = :is_registered, telegram_username = :telegram_username, updated_at = :updated_at",
                    ExpressionAttributeValues={
                        ":is_registered": True,
                        ":telegram_username": user_input.telegram_username,
                        ":updated_at": datetime.utcnow().isoformat(),
                    },
                )
                # Retrieve the updated user
                response = table.get_item(
                    Key={"wallet_public_key": user_input.wallet_public_key}
                )
                updated_user = response.get("Item")
                return format_user(updated_user)
            else:
                # User is already registered, update telegram_username if changed
                if (
                    existing_user.get("telegram_username")
                    != user_input.telegram_username
                ):
                    table.update_item(
                        Key={"wallet_public_key": user_input.wallet_public_key},
                        UpdateExpression="SET telegram_username = :telegram_username, updated_at = :updated_at",
                        ExpressionAttributeValues={
                            ":telegram_username": user_input.telegram_username,
                            ":updated_at": datetime.utcnow().isoformat(),
                        },
                    )
                    response = table.get_item(
                        Key={"wallet_public_key": user_input.wallet_public_key}
                    )
                    updated_user = response.get("Item")
                    return format_user(updated_user)
                else:
                    return format_user(existing_user)
        else:
            # User does not exist, create new user
            new_user = {
                "wallet_public_key": user_input.wallet_public_key,
                "telegram_username": user_input.telegram_username,
                "is_registered": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            table.put_item(Item=new_user)
            return format_user(new_user)

    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create or update user: {str(e)}"
        )


# Get all users


@router.get("/", response_model=List[User])
async def get_users(table=Depends(get_users_table)):
    try:
        response = table.scan()
        users = response.get("Items", [])
        return [format_user(user) for user in users]
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve users: {str(e)}"
        )


# Get a specific user by wallet_public_key
@router.get("/{wallet_public_key}", response_model=UserResponse)
async def get_user(wallet_public_key: str, table=Depends(get_users_table)):
    try:
        response = table.get_item(Key={"wallet_public_key": wallet_public_key})
        user = response.get("Item")
        if not user:
            # Return only is_registered: False
            return {"is_registered": False}
        else:
            # Return user data with is_registered: True
            return format_user(user)
    except ClientError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve user: {str(e)}"
        )


# Update a user
@router.put("/{wallet_public_key}", response_model=User)
async def update_user(
    wallet_public_key: str,
    user_update: UserUpdate,
    table=Depends(get_users_table),
):
    update_data = user_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_expression = "SET " + ", ".join(f"#{k}=:{k}" for k in update_data.keys())
    update_expression += ", updated_at=:updated_at"

    expression_attribute_names = {f"#{k}": k for k in update_data.keys()}
    expression_attribute_values = {f":{k}": v for k, v in update_data.items()}
    expression_attribute_values[":updated_at"] = datetime.utcnow().isoformat()

    try:
        response = table.update_item(
            Key={"wallet_public_key": wallet_public_key},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW",
        )
        updated_user = response.get("Attributes")
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        return format_user(updated_user)
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


# Delete a user


@router.delete("/{wallet_public_key}", status_code=204)
async def delete_user(wallet_public_key: str, table=Depends(get_users_table)):
    try:
        response = table.delete_item(
            Key={"wallet_public_key": wallet_public_key}, ReturnValues="ALL_OLD"
        )
        deleted_user = response.get("Attributes")
        if not deleted_user:
            raise HTTPException(status_code=404, detail="User not found")
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
