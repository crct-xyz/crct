import json
import boto3
from boto3.dynamodb.types import TypeDeserializer
import os

# Initialize the SQS sqs_client
sqs_client = boto3.client("sqs")

# You can store the SQS queue URL as an environment variable
SQS_QUEUE_URL = os.environ["SQS_QUEUE_URL"]


def lambda_handler(event, context):
    print("Lambda function invoked with event:")
    print(json.dumps(event))

    try:
        for record in event["Records"]:
            # Check if the event is an INSERT
            if record["eventName"] == "INSERT":
                # Extract the new image
                new_image = record["dynamodb"]["NewImage"]

                # Deserialize DynamoDB data types
                order_item = deserialize_dynamodb_item(new_image)

                # Check if the order is a USDC request
                action_event = order_item.get("action_event", {})
                event_type = action_event.get("event_type", "")

                if event_type == "usdc_request":
                    # Extract details
                    details = action_event.get("details", {})
                    telegram_username = details.get("telegram_username", "")
                    amount = details.get("amount", "")
                    currency = details.get("currency", "")
                    user_id = order_item.get("user_id")

                    # Validate extracted values
                    if not all([user_id, amount, telegram_username]):
                        raise ValueError(
                            "Missing required fields for USDC request")

                    # Perform your custom logic here
                    print(f"USDC request order detected:")
                    print(f"User ID: {user_id}")
                    print(
                        f"Requesting from Telegram user: {telegram_username}")
                    print(f"Amount: {amount} {currency}")

                    # Generate message for queue
                    queue_message = return_message_for_queue(
                        user_id, amount, telegram_username
                    )

                    response = sqs_client.send_message(
                        QueueUrl=SQS_QUEUE_URL,
                        MessageBody=json.dumps(queue_message),
                        # Optional: Add Message Attributes
                        MessageAttributes={
                            "EventType": {
                                "DataType": "String",
                                "StringValue": "usdc_request",
                            }
                        },
                    )

                    return {
                        "statusCode": 200,
                        "body": json.dumps("Message sent to SQS"),
                    }

        # If no USDC request was found
        return {
            "statusCode": 200,
            "body": json.dumps("No USDC request orders processed."),
        }

    except Exception as e:
        print(f"Error processing event: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error processing USDC request: {str(e)}"),
        }


def deserialize_dynamodb_item(item):
    """
    Converts a DynamoDB item to a regular dictionary.
    """
    deserializer = TypeDeserializer()
    return {k: deserializer.deserialize(v) for k, v in item.items()}


def return_message_for_queue(wallet_id, amount, requestee):
    # pass with requester, usdc value, requestee
    # Create a dictionary with the message data
    message = {
        "wallet_id": wallet_id,
        "amount": amount,
        "requestee": requestee,
    }

    # Convert the dictionary to a JSON string
    json_message = json.dumps(message)

    return json_message
