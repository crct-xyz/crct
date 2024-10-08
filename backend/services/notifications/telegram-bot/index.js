const TelegramBot = require("node-telegram-bot-api");
const AWS = require("aws-sdk");
const axios = require("axios");

// Initialize AWS SDK
const sqs = new AWS.SQS();

// Initialize Telegram bot with webhook
const bot = new TelegramBot(process.env.BOT_TOKEN, {
	webHook: true,
});

bot.setWebHook(process.env.WEBHOOK_URL);

const dbUrl = process.env.DB_URL;
const notificationQueueUrl = process.env.NOTIFICATION_QUEUE_URL;
const actionBuilderURL = process.env.ACTION_BUILDER_QUEUE_URL;
const actionsDbURL = process.env.ACTIONS_DB_URL;

// Main Lambda handler
exports.handler = async (event) => {
	console.log("Received event:", JSON.stringify(event, null, 2));

	if (event.Records) {
		// Handle SQS messages
		return await handleSQSMessages(event.Records);
	} else if (event.body) {
		// Handle Telegram updates
		return await handleTelegramUpdate(event.body);
	} else {
		console.log("Unsupported event type");
		return {
			statusCode: 400,
			body: JSON.stringify({ message: "Unsupported event type" }),
		};
	}
};

//
//Code to handle SQS Messages
//

async function handleSQSMessages(records) {
	for (const record of records) {
		const parsedRecord = JSON.parse(record.body);
		console.log("Parsed record:", parsedRecord);
		const recipients = parsedRecord.Recipients;
		const userId = parsedRecord.User_ID;

		// Delete the message from the queue
		await deleteMessage(record.receiptHandle);
		console.log("Message deleted:", record.messageId);

		const actionID = 7;
		const blinkUrl = `https://dial.to/?action=solana-action%3Ahttps://squint-api.vercel.app/actions/${actionID}`;

		// Send message to recipient
		await sendMessageToUser(recipients, blinkUrl);
	}

	return {
		statusCode: 200,
		body: JSON.stringify({ message: "SQS messages processed successfully" }),
	};
}

// Function to delete a message from the SQS queue
async function deleteMessage(receiptHandle) {
	const deleteParams = {
		QueueUrl: notificationQueueUrl,
		ReceiptHandle: receiptHandle,
	};

	try {
		await sqs.deleteMessage(deleteParams).promise();
		console.log("Message deleted successfully:", receiptHandle);
	} catch (error) {
		console.error("Error deleting message:", error);
	}
}

//
//Code to handle Telegram events
//

// Function to handle updates
async function handleTelegramUpdate(body) {
	const update = JSON.parse(body);
	// Process the Telegram update
	await bot.processUpdate(update);

	return {
		statusCode: 200,
		body: JSON.stringify({ message: "Telegram update processed successfully" }),
	};
}

// Function to send a message to a user identified by their username
async function sendMessageToUser(username, url) {
	try {
		// Get the chat ID associated with the username
		const chatId = await getChatIdFromUsername(username);
		if (chatId) {
			// Send the message to the user
			await bot.sendMessage(chatId, `Here's your link: ${url}`);
			console.log(`Message sent to ${username} with URL: ${url}`);
		} else {
			console.log(`Unable to find chat ID for username: ${username}`);
		}
	} catch (error) {
		console.error(`Error sending message to ${username}:`, error);
	}
}

// Function to retrieve chat ID from the database using the username
async function getChatIdFromUsername(username) {
	try {
		// Fetch user data from the database
		const response = await axios.get(dbUrl);
		const data = response.data;

		// Find the user with the matching Telegram username
		const user = data.find((item) => item.telegram_user === username);
		if (user) {
			// Return the session_id (chat ID) if found
			return user.session_id;
		} else {
			console.log(`No chat ID found for username: ${username}`);
			return null;
		}
	} catch (error) {
		console.error(`Error fetching chat ID for username ${username}:`, error);
		return null;
	}
}

//Set up /start command
bot.onText(/\/start/, async (msg) => {
	const chatId = msg.chat.id;

	try {
		// Fetch existing user data from the database
		const response = await axios.get(dbUrl);
		const data = response.data;

		// Check if the user already exists in the database
		const existingUser = data.find((item) => item.session_id === chatId);

		if (existingUser) {
			console.log("Session ID already present in data");
		} else {
			// Create new user data
			const postData = {
				telegram_user: msg.chat.username,
				session_id: chatId,
			};

			// Save the new user data to the database
			await axios.post(dbUrl, postData, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			console.log("User data saved successfully");
		}

		// Send a confirmation message to the user
		await bot.sendMessage(chatId, "Bot has started.");
	} catch (error) {
		console.error("Error in /start command:", error);
		await bot.sendMessage(chatId, "Error occurred while starting the bot.");
	}
});

//Set up /help

bot.onText(/\/help/, (msg) => {
	const chatId = msg.chat.id;
	bot.sendMessage(
		chatId,
		"Available commands:\n/start - Start the bot\n/help - Show this help message",
	);
});
