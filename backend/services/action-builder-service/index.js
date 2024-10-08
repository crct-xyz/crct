"use strict";

const AWS = require("aws-sdk");
const axios = require("axios");
const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const multisig = require("@sqds/multisig");

const sqs = new AWS.SQS({ region: process.env.AWS_REGION || "eu-central-1" }); // AWS region from ENV

// Constants for URLs and configurations, now using environment variables
const BASE_URL = process.env.BASE_URL || "localhost";
const QUEUE_URL = process.env.QUEUE_URL; // Action Builder Queue URL from ENV
const TRANSACTION_QUEUE_URL = process.env.TRANSACTION_QUEUE_URL; // Transaction Signatures Queue URL from ENV
const ACTION_TYPES_DB_URL = process.env.ACTION_TYPES_DB_URL; // Action Types DB URL from ENV
const ACTIONS_DB_URL = process.env.ACTIONS_DB_URL; // Actions DB URL from ENV

/**
 * Safely parses a JSON string and handles JSON parse errors gracefully.
 * @param {string} jsonString - The JSON string to parse.
 * @returns {object|null} - The parsed object or null if parsing failed.
 */
function safeParseJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("JSON parse error:", e);
    return null;
  }
}

/**
 * Sends a message to the SQS queue.
 * @param {number} typeID
 * @param {string} userID
 * @param {string} recipients
 * @param {number|null} transactionIndex
 * @param {string} orderID
 */
async function sendToSQS(typeID, userID, recipients, transactionType, orderID) {
  const params = {
    MessageBody: JSON.stringify({
      Type_ID: typeID,
      User_ID: userID,
      Recipients: recipients,
      Transaction_Type: transactionType,
      Order_id: orderID,
    }),
    QueueUrl: QUEUE_URL,
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log("Message sent to SQS:", result.MessageId);
  } catch (error) {
    console.error("Error sending message to SQS:", error);
  }
}

/**
 * Deletes a message from the SQS queue.
 * @param {string} receiptHandle
 */
async function deleteMessage(receiptHandle) {
  const deleteParams = {
    QueueUrl: TRANSACTION_QUEUE_URL,
    ReceiptHandle: receiptHandle,
  };

  try {
    await sqs.deleteMessage(deleteParams).promise();
    console.log("Message deleted successfully:", receiptHandle);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
}

/**
 * Posts data to the actions database.
 * @param {object} postDataItems
 */
async function postData(postDataItems) {
  try {
    const response = await axios.post(ACTIONS_DB_URL, postDataItems);
    console.log("Data posted to actions DB:", response.data);
  } catch (error) {
    console.error(
      "Error posting data:",
      error.response ? error.response.data : error.message,
    );
  }
}

/**
 *Generate a unique integer action_id
 */
function generateUniqueActionId() {
  const timestampPart = Date.now(); // Current timestamp in milliseconds
  const randomPart = Math.floor(Math.random() * 1000); // Random number between 0 and 999
  return parseInt(`${timestampPart}${randomPart}`);
}

const getMultisigAccount = async (vaultId) => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const multisigPda = new PublicKey(vaultId);
  try {
    return await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigPda,
    );
  } catch (error) {
    console.error("Error fetching multisig account:", error);
    return null;
  }
};

const createPayload = (
  transactionType,
  userId,
  vaultId,
  multisigAccount,
  amount,
  requestee,
) => {
  const baseHref = `${BASE_URL}/api`;

  if (transactionType === "approve_tx" || transactionType === "reject_tx") {
    return {
      title: "Review SQUADS transaction",
      icon: "https://ucarecdn.com/5313a77d-9e46-4d72-abf1-8df585bde2a3/",
      description: `Voting for transaction number: ${multisigAccount.transactionIndex}`,
      label: "squads",
      links: {
        actions: [
          {
            label: "Approve",
            href: `${baseHref}/actions/squad/${vaultId}?action=approve&multisigAddress=${vaultId}&txIndex=${multisigAccount.transactionIndex}`,
          },
          {
            label: "Reject",
            href: `${baseHref}/actions/squad/${vaultId}?action=reject&multisigAddress=${vaultId}&txIndex=${multisigAccount.transactionIndex}`,
          },
          {
            label: "Execute",
            href: `${baseHref}/actions/squad/${vaultId}?action=execute&multisigAddress=${vaultId}&txIndex=${multisigAccount.transactionIndex}`,
          },
        ],
      },
    };
  } else if (transactionType === "usdc_request") {
    return {
      title: "USDC Request",
      icon: "https://ucarecdn.com/5313a77d-9e46-4d72-abf1-8df585bde2a3/",
      description: `User ${userId} has requested ${amount} USDC.`,
      label: "usdc",
      links: {
        actions: [
          {
            label: "Approve",
            href: `${baseHref}/usdc/approve?userId=${userId}&amount=${amount}`,
          },
          {
            label: "Reject",
            href: `${baseHref}/usdc/reject?userId=${userId}`,
          },
        ],
      },
    };
  }
};

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const parsedBody =
      typeof record.body === "string"
        ? safeParseJSON(record.body)
        : record.body;
    if (!parsedBody) {
      console.error("Failed to parse message body:", record.body);
      continue;
    }

    console.log("Parsed record:", parsedBody);

    const {
      Transaction_Type: transactionType,
      Action_Event: actionEvent,
      User_ID: userId,
      Vault_ID: vaultId,
      Recipients: recipients,
      orderID,
      wallet_id,
      amount,
      requestee,
    } = parsedBody;

    const eventType = actionEvent?.event_type || "usdc_request_event";

    await deleteMessage(record.receiptHandle);
    console.log("Deleted message:", record.messageId);

    console.log("Transaction Type:", transactionType);
    console.log("Event Type:", eventType);
    console.log("User ID:", userId || wallet_id);

    try {
      const { data: actionTypes } = await axios.get(ACTION_TYPES_DB_URL);
      const actionTypeItem = actionTypes.find(
        (item) => item.contract_name === eventType,
      );

      if (!actionTypeItem) {
        console.error(
          "No matching action type found for event type:",
          eventType,
        );
        continue;
      }

      const typeID = actionTypeItem.type_id;
      const multisigAccount =
        transactionType !== "usdc_request"
          ? await getMultisigAccount(vaultId)
          : null;

      if (transactionType !== "usdc_request" && !multisigAccount) {
        continue;
      }

      const payload = createPayload(
        transactionType,
        userId || wallet_id,
        vaultId,
        multisigAccount,
        amount,
        requestee,
      );

      const postDataItems = {
        action_id: generateUniqueActionId(),
        action_type_id: typeID,
        user_id: userId || wallet_id,
        payload,
      };

      console.log("postDataItems:", postDataItems);

      await postData(postDataItems);

      await sendToSQS(
        typeID,
        userId || wallet_id,
        recipients,
        transactionType === "usdc_request"
          ? null
          : multisigAccount.transactionIndex,
        orderID,
      );

      console.log(
        "Action processed successfully for message:",
        record.messageId,
      );
    } catch (error) {
      console.error("Error processing record:", error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify("Processing completed."),
  };
};
