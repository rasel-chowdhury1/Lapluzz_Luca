import { User } from "../modules/user/user.models";
import admin from "firebase-admin";
import { getMessaging, Message } from "firebase-admin/messaging";
import { initializeApp, credential } from "firebase-admin"; // Correct import for credential
// Use `require` to load the JSON file
const serviceAccount = require("../../../googleFirebaseAdmin.json"); // Adjust the path accordingly

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  initializeApp({
    credential: credential.cert(serviceAccount), // Correct usage of credential
  });
}

// Function to send notification to a user
export const sendNotification = async (receiverId: string, textMessage: string): Promise<void> => {
  try {
    // Fetch the user by ID
    const findUser = await User.findOne({ _id: receiverId });

    // If the user is not found, log and return early
    if (!findUser) {
      console.log(`User with id ${receiverId} not found`);
      return;
    }

    const { fcmToken } = findUser;

    // Ensure the FCM token is valid
    if (!fcmToken?.trim()) {
      console.log(`No valid FCM token found for user: ${receiverId}`);
      return;
    }

    // Construct the notification message
    const message: Message = {
      notification: {
        title: `New message from  Admin`, // Set title dynamically with user's name or default to "Admin"
        body: textMessage, // Set the body of the notification
      },
      token: fcmToken, // Use the user's FCM token to send the message
    };

    // Send the notification
    const response = await getMessaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    // Log the error if sending the message fails
    console.error("Error sending message:", error);
  }
};