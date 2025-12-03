import { User } from "../modules/user/user.models";
import admin from "firebase-admin";
import { getMessaging, Message } from "firebase-admin/messaging";
import { initializeApp, credential } from "firebase-admin"; // Correct import for credential
import { connectedUserOnChat } from "../../socketIo";
// Use `require` to load the JSON file
const serviceAccount = require("../../../googleFirebaseAdmin.json"); // Adjust the path accordingly

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
// Function to send notification to a user
export const sendNotificationByFcmToken = async (receiverId: any, textMessage: string,  titleName?: string,): Promise<void> => {
  

  console.log({receiverId,textMessage})
    // Fetch the user by ID
    const findUser = await User.findOne({ _id: receiverId });

    console.log({findUser})

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
        title: titleName || "Supporto Pianofesta", //Pianofesta Support // Set title dynamically with user's name or default to "Admin"
        body: textMessage, // Set the body of the notification
      },
      token: fcmToken, // Use the user's FCM token to send the message
    };

    getMessaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
        console.log(response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  

};

// Function to send notification to a user
export const sendReminderNotification = async (receiverId: any, title: string, textMessage: string): Promise<void> => {

    // Fetch the user by ID
    const findUser = await User.findOne({ _id: receiverId });

    console.log({findUser})

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
        title: "Pianofesta Support", // Set title dynamically with user's name or default to "Admin"
        body: textMessage, // Set the body of the notification
      },
      token: fcmToken, // Use the user's FCM token to send the message
    };

    getMessaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
        console.log(response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  

};

export const sentNotificationToReciverForNewMessageByFcmToken = async (
  receiverId: any,
  textMessage: string,
  senderName?: string,
  senderImage?: string
): Promise<void> => {
  try {

    console.log({receiverId,textMessage,senderName, senderImage})
    // 1️⃣ Check if user is already connected via socket
    const userSocket = connectedUserOnChat.get(receiverId.toString());
    if (userSocket) {
      return; // If user is online, no need to send FCM
    }

    // 2️⃣ Fetch the user by ID
    const findUser = await User.findById(receiverId);
    if (!findUser) {
      console.log(`User with id ${receiverId} not found`);
      return;
    }

    const { fcmToken } = findUser;
    if (!fcmToken?.trim()) {
      console.log(`No valid FCM token found for user: ${receiverId}`);
      return;
    }

    // 3️⃣ Construct the FCM message
    const message: Message = {
      token: fcmToken,
      notification: {
        title: `${senderName || "Pianofesta Support"} sent you a new message`, // Dynamic title
        body: textMessage,
      },
      android: {
        notification: {
          imageUrl: senderImage || undefined, // Optional image for Android
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: `${senderName || "Admin"} sent you a new message`,
              body: textMessage,
            },
            mutableContent: true,
          },
        }
      },
    };

    // 4️⃣ Send the notification
    getMessaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });
  } catch (err) {
    console.error("Error in sending FCM notification:", err);
  }
};




// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// // Function to send notification to a user
// export const sendNotificationByFcmToken = async (receiverId: any, textMessage: string): Promise<void> => {
//   try {
//     // Fetch the user by ID
//     const findUser = await User.findOne({ _id: receiverId });

//     console.log({findUser})

//     // If the user is not found, log and return early
//     if (!findUser) {
//       console.log(`User with id ${receiverId} not found`);
//       return;
//     }

//     const { fcmToken } = findUser;

//     // Ensure the FCM token is valid
//     if (!fcmToken?.trim()) {
//       console.log(`No valid FCM token found for user: ${receiverId}`);
//       return;
//     }

//     // Construct the notification message
//     const message: Message = {
//       notification: {
//         title: textMessage, // Set title dynamically with user's name or default to "Admin"
//         body: textMessage, // Set the body of the notification
//       },
//       token: fcmToken, // Use the user's FCM token to send the message
//     };

//     // Send the notification
//     const response = await getMessaging().send(message);
//     console.log("Successfully sent message:", response);
//   } catch (error) {
//     // Log the error if sending the message fails
//     console.error("Error sending message:", error);
//   }
// };

