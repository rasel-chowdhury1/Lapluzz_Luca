import express, { Application } from 'express';
import { Server as HttpServer } from 'http';
import httpStatus from 'http-status';
import moment from 'moment-timezone';
import mongoose from 'mongoose';
import { Socket, Server as SocketIOServer } from 'socket.io';
import config from './app/config';
import AppError from './app/error/AppError';
import BusinessEngagementStats from './app/modules/businessEngaagementStats/businessEngaagementStats.model';
import Chat from './app/modules/chat/chat.model';
import { ChatService } from './app/modules/chat/chat.service';
import { EventInterestUserList } from './app/modules/eventInterest/eventInterest.model';
import Friendship from './app/modules/friendShip/friendShip.model';
import Message from './app/modules/message/message.model';
import { messageService } from './app/modules/message/message.service';
import Notification from './app/modules/notifications/notifications.model';
import { User } from './app/modules/user/user.models';
import { callbackFn } from './app/utils/callbackFn';
import { verifyToken } from './app/utils/tokenManage';
import { sendNotificationByFcmToken, sendReminderNotification } from './app/utils/sentNotificationByFcmToken';
import { v4 as uuidv4 } from 'uuid';
// Define the socket server port
const socketPort: number = parseInt(process.env.SOCKET_PORT || '9020', 10);

const app: Application = express();

declare module 'socket.io' {
  interface Socket {
    user?: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
  }
}

// Initialize the Socket.IO server
let io: SocketIOServer;

export const connectedUsers = new Map<
  string,
  {
    socketID: string;
  }
>();

export const onlineFriendshipUser = new Map<
  string,
  {
    friends: string[];
  }
>();

// console.log('connectedUsers ---->>> ', connectedUsers);

export const initSocketIO = async (server: HttpServer): Promise<void> => {

  const { Server } = await import('socket.io');

  io = new Server(server, {
    cors: {
      origin: '*', // Replace with your client's origin
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'], // Add any custom headers if needed
      credentials: true,
    },
  });
  // Start the HTTP server on the specified port
  server.listen(socketPort, () => {
    console.log(
      //@ts-ignore
      `---> Socket server is listening on : http://${config.ip}:${config.socket_port}`.yellow
        .bold,
    );
  });

  // Authentication middleware: now takes the token from headers.
  io.use(async (socket: Socket, next: (err?: any) => void) => {
    // Extract token from headers (ensure your client sends it in headers)
    const token =
      (socket.handshake.auth.token as string) ||
      (socket.handshake.headers.token as string) ||
      (socket.handshake.headers.authorization as string);

    console.log("sockte time zone =>>> ", socket.handshake.time)

    if (!token) {
      return next(
        new AppError(
          httpStatus.UNAUTHORIZED,
          'Authentication error: Token missing',
        ),
      );
    }

    // console.log(token, 'token from socket ========================>');

    const userDetails = verifyToken({
      token,
      access_secret: config.jwt_access_secret as string,
    });

    if (!userDetails) {
      return next(new AppError(httpStatus.UNAUTHORIZED, 'Authentication error: Invalid token'));
    }

    const user = await User.findById(userDetails.userId);
    if (!user) {
      return next(new AppError(httpStatus.NOT_FOUND, 'Authentication error: User not found'));
    }

    socket.user = {
      _id: user._id.toString(), // Convert _id to string if necessary
      name: user.sureName as string,
      email: user.email,
      role: user.role,
    };
    next();
  });

  io.on('connection', (socket: Socket) => {
    // =================== try catch 1 start ================
    try {
      // Automatically register the connected user to avoid missing the "userConnected" event.
      if (socket.user && socket.user._id) {
        connectedUsers.set(socket.user._id.toString(), { socketID: socket.id });
        emitOnlineUser(socket.user?._id);
        // console.log(
        //   `Registered user testing ${socket.user._id.toString()} with socket ID: ${socket.id}`,
        // );
      }

      // (Optional) In addition to auto-registering, you can still listen for a "userConnected" event if needed.
      socket.on('userConnected', ({ userId }: { userId: string }) => {
        connectedUsers.set(userId, { socketID: socket.id });
        // console.log(`User ${userId} connected with socket ID: ${socket.id}`);
      });



      //----------------------online array send for front end------------------------//
      io.emit('onlineUser', Array.from(connectedUsers));

      // ===================== join by user id ================================
      // socket.join(user?._id?.toString());

      //----------------------user details and messages send end for front end -->(as need to use)------------------------//

      //----------------------active user list of specific user start------------------------//
      //   socket.on('online-active-user', async ({}, callback) => {
      //     // Query the Friendship collection to find a record for the specific user (userId)
      //     const userList = await Friendship.findOne({
      //       userId: (socket as any).user._id,
      //     }).populate('friendship', 'fullName profileImage'); // Populate the 'friendship' field with 'fullName' and 'profileImage'

      //     // If no friends found, return an empty array
      //     if (!userList || !userList.friendship) {
      //       return callback({ success: true, data: [] });
      //     }

      //     // Filter the friends list to only include those who are currently connected
      //     const connectedFriends = userList.friendship.filter((friend) => {
      //       return connectedUsers.has((friend as any)._id.toString()); // Check if the friend is in the connectedUsers map
      //     });

      //     console.log('connected user ->>>> ', connectedFriends);

      //     const userSocket = connectedUsers.get((socket as any).user._id);

      //     if (userSocket) {
      //       io.to(userSocket?.socketID).emit('active-users', {
      //         success: true,
      //         data: connectedFriends,
      //       });
      //     }
      //     // Return the list of connected users
      //     callback({ success: true, data: connectedFriends });
      //   });
      //----------------------active user list of specific user end------------------------//


      //----------------------chat list start------------------------//
      socket.on('my-chat-list', async ({ }, callback) => {
        try {
          const chatList = await ChatService.getMyChatList(
            (socket as any).user._id,
            {},
          );

          const userSocket = connectedUsers.get((socket as any).user._id);

          if (userSocket) {
            io.emit(`chat-list::${(socket as any).user._id}`, chatList);
            callbackFn(callback, { success: true, message: chatList });
          }

          callbackFn(callback, {
            success: false,
            message: 'not found your socket id.',
          });
        } catch (error: any) {
          callbackFn(callback, {
            success: false,
            message: error.message,
          });
          io.emit('io-error', { success: false, message: error.message });
        }
      });
      //----------------------chat list end------------------------//

      socket.on(
        'send-message',
        async (payload: { text: string; images: string[], chatId: string }, callback) => {
          console.log({ payload });
          // Check if chatId is provided
          if (!payload.chatId) {
            callbackFn(callback, {
              success: false,
              message: 'chatId is required',
            });
            io.emit('io-error', {
              success: false,
              message: 'chatId is required',
            });
            return;
          }

          try {
            // Find the chat by chatId
            const chatData = await Chat.findById(payload.chatId).select(
              'users',
            );

            // Check if the chat exists
            if (!chatData) {
              callbackFn(callback, {
                success: false,
                message: 'Chat not found',
              });
              io.emit('io-error', {
                success: false,
                message: 'Chat not found',
              });
              return; // Exit if chat doesn't exist
            }

            // Extract users and filter out the sender
            const usersToNotify = chatData.users.filter(
              (user) => user.toString() !== socket?.user?._id,
            );

            console.log("userNotify ->> ", usersToNotify);
            console.log("connected users _>>", connectedUsers)
            // Notify users who are online
            const userSocketIds: string[] = [];
            usersToNotify.forEach((user) => {
              const userSocket = connectedUsers.get(user.toString());
              if (userSocket) {
                userSocketIds.push(userSocket.socketID); // Collect socket IDs
              }
            });

            console.log("socket =>>>>>> ", socket)

            const userTimeZone = 'Asia/Dhaka'; // Dynamic time zone or default to Asia/Dhaka

            // Get the current time in the user's time zone
            const messageTime = moment().tz(userTimeZone).format('YYYY-MM-DDTHH:mm:ss.SSS');

            socket.emit(`message_received::${payload.chatId}`, {
              success: true,
              sender: socket?.user?._id,
              message: payload.text,
              images: payload.images,
              createdAt: messageTime
            });

            console.log(userSocketIds)

            // If there are users to notify, emit the message to them
            if (userSocketIds.length > 0) {
              console.log("excute this -> ")
              // const messageTime = new Date()



              console.log({ messageTime })
              io.to(userSocketIds).emit('newMessage', {
                success: true,
                chatId: payload.chatId,
                message: payload.text,
                images: payload.images,
                createdAt: messageTime
              })
              io.to(userSocketIds).emit(`message_received`, {
                success: true,
                sender: socket?.user?._id,
                message: payload.text,
                images: payload.images,
                createdAt: messageTime
              });
              io.to(userSocketIds).emit(`message_received::${payload.chatId}`, {
                success: true,
                sender: socket?.user?._id,
                message: payload.text,
                images: payload.images,
                createdAt: messageTime
              });
            }

            // Store the message in the database
            await Message.create({
              sender: socket?.user?._id,
              text: payload.text,
              images: payload.images,
              chat: payload.chatId,
            });

            // Send success callback to the sender
            callbackFn(callback, {
              success: true,
              message: { message: payload.text, images: payload.images, sender: socket?.user?._id, createdAt: messageTime },
            });

          } catch (error) {
            // Handle any potential errors (e.g., database issues)
            console.error('Error sending message: ', error);
            callbackFn(callback, {
              success: false,
              message: 'An error occurred while sending the message',
            });
            io.emit('io-error', {
              success: false,
              message: 'An error occurred while sending the message',
            });
          }
        },
      );

      //-------------- seen message start -----------------------//
      socket.on('seen', async ({ chatId }, callback) => {
        if (!chatId) {
          callbackFn(callback, {
            success: false,
            message: 'chatId id is required',
          });
          io.emit('io-error', {
            success: false,
            message: 'chatId id is required',
          });
        }

        try {
          await messageService.seenMessage((socket as any).user._id, chatId);
        } catch (error: any) {
          callbackFn(callback, {
            success: false,
            message: error.message,
          });
          console.error('Error in seen event:', error);
          socket.emit('error', { message: error.message });
        }
      });
      //-------------- seen message end -----------------------//

      //-----------------------Typing functionlity start ------------------------//
      socket.on('typing', (data, callback) => {
        const chat = 'typing::' + data.chatId.toString();
        const result = {
          success: true,
          fullName: data.fullName,
          typingUserId: (socket as any).user._id,
        };
        console.log('==== message === ', result);

        io.emit(chat, result);
        callbackFn(callback, result);
      });
      //-----------------------Typing functionlity end ------------------------//

      //=============       stop typeing  start ================
      socket.on('stopTyping', (data, callback) => {
        const chat = 'stopTyping::' + data.chatId.toString();
        const typeingChat = 'typing::' + data.chatId.toString();
        const message = data?.fullName + ' is stop typing...';

        io.emit(chat, { message: message });
        io.emit(typeingChat, {
          success: false,
          fullName: data.fullName,
          typingUserId: (socket as any).user._id,
        });
        callbackFn(callback, {
          success: true,
          message: message,
        });
      });
      //----------------------- stop functionlity end ------------------------//

      //  socket.on("testing", (data,callback) => {
      //   emitNotification({userId: "67f655753a650ee003d05531" as any, receiverId: '67fa2cbd7fbe6dc3db9434d5' as any, userMsg: {
      //     image: 'testing',
      //     text: "testing",
      //     photos: []
      //   }, type: "interested"})
      //  })

      //-----------------------Disconnect functionlity start ------------------------//
      socket.on('disconnect', () => {
        console.log(
          `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`,
        );

        // Remove user from connectedUsers map
        for (const [key, value] of connectedUsers.entries()) {
          if (value.socketID === socket.id) {
            connectedUsers.delete(key);
            break;
          }
        }

        io.emit('onlineUser', Array.from(connectedUsers));
        emitOnlineUser(socket.user?._id as any);
      });
      //-----------------------Disconnect functionlity end ------------------------//
    } catch (error) {
      console.error('-- socket.io connection error --', error);

      // throw new Error(error)
      //-----------------------Disconnect functionlity start ------------------------//
      socket.on('disconnect', () => {
        console.log(
          `${socket.user?.name} || ${socket.user?.email} || ${socket.user?._id} just disconnected with socket ID: ${socket.id}`,
        );

        // Remove user from connectedUsers map
        for (const [key, value] of connectedUsers.entries()) {
          if (value.socketID === socket.id) {
            connectedUsers.delete(key);
            break;
          }
        }
        io.emit('onlineUser', Array.from(connectedUsers));
        emitOnlineUser(socket.user?._id as any);
      });
      //-----------------------Disconnect functionlity end ------------------------//
    }
    // ==================== try catch 1 end ==================== //
  });
};

// Export the Socket.IO instance
export { io };

export const emitNotification = async ({
  userId,
  receiverId,
  userMsg,
  type,
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg?: { image: string; text: string; photos?: string[] };
  type?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });

  console.log('userSocket ------>>>> ', userSocket);
  console.log('connected ---->>> ', connectedUsers);

  // Notify the specific user
  if (userMsg && userSocket) {
    console.log();
    io.to(userSocket.socketID).emit(`notification`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });
  }


  console.log({receiverId})
  io.emit(`notification::${receiverId}`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });

  // Save notification to the database
  const newNotification = {
    userId, // Ensure that userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure that receiverId is of type mongoose.Types.ObjectId
    message: userMsg,
    type, // Use the provided type (default to "FollowRequest")
    isRead: false, // Set to false since the notification is unread initially
    timestamp: new Date(), // Timestamp of when the notification is created
  };

  // Save notification to the database
  const result = await Notification.create(newNotification);

  const msg = userMsg?.text || "something";
  
  sendNotificationByFcmToken(receiverId, msg)
  console.log({ result });
};

export const emitCreatedNewEvent = async ({
  userList,
}: {
  userList: mongoose.Types.ObjectId[];
}): Promise<void> => {
  // Ensure io is initialized
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  // Iterate over the userList to emit the event to each user's socket
  for (let i = 0; i < userList.length; i++) {
    // Get the socket ID of the specific user
    const userSocket = connectedUsers.get(userList[i].toString());

    // If the socket ID exists for the user, emit the event
    if (userSocket) {
      io.to(userSocket.socketID).emit('addedNewEvent', {
        statusCode: 200,
        success: true,
        message: 'New event added successfully', // You can modify the message here if needed
      });
    }
  }
};

export const emitAcceptedRequest = async (userId: string) => {
  // Ensure io is initialized
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }
  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(userId);

  // If the socket ID exists for the user, emit the event
  if (userSocket) {
    io.to(userSocket.socketID).emit('acceptedRequest', {
      statusCode: 200,
      success: true,
      data: userId,
      message: 'Accepted your request', // You can modify the message here if needed
    });
  }
};

export const emitDirectNotification = async ({
  userId,
  receiverId,
  userMsg
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg?: { image: string; text: string; name: string };
}): Promise<void> => {

  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });


  // Notify the specific user
  if (userMsg && userSocket) {
    console.log();
    io.to(userSocket.socketID).emit(`notification`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });
  }

  // Save notification to the database
  const newNotification = {
    userId, // Ensure that userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure that receiverId is of type mongoose.Types.ObjectId
    message: userMsg,
    type: "direct", // Use the provided type (default to "FollowRequest")
    isRead: false, // Set to false since the notification is unread initially
    timestamp: new Date(), // Timestamp of when the notification is created
  };

  // Save notification to the database
  const result = await Notification.create(newNotification);

  const msg = userMsg?.text || "something";
  
  sendNotificationByFcmToken(receiverId, msg)

  console.log({ result });
};


export const emitMassNotification = async ({
  userId,
  receiverId,
  userMsg
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg?: { image: string; text: string;  };
  type?: string;
}): Promise<void> => {

  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });


  // Notify the specific user
  if (userMsg && userSocket) {
    console.log();
    io.to(userSocket.socketID).emit(`notification`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });
  }

  // Save notification to the database
  const newNotification = {
    userId, // Ensure that userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure that receiverId is of type mongoose.Types.ObjectId
    message: userMsg,
    type: "mass", // Use the provided type (default to "FollowRequest")
    isRead: false, // Set to false since the notification is unread initially
    timestamp: new Date(), // Timestamp of when the notification is created
  };

  // Save notification to the database
  await Notification.create(newNotification);
   const msg = userMsg?.text || "something";
  
    sendNotificationByFcmToken(receiverId, msg)
};


export const emitNotificationToFollowersOfBusiness = async ({
  userId,
  userMsg,
  type,
}: {
  userId: mongoose.Types.ObjectId;
  userMsg?: { image?: string; text: string; name: string; notificationFor: string };
  type?: string;
}): Promise<void> => {
  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Generate a unique ID for this notification event
  const notificationEventId = uuidv4();

  // 1. Find followers of the business
  const engagement = await BusinessEngagementStats.findOne({
    businessId: userMsg?.notificationFor, // business ID
  }).select('followers');

  console.log({ engagement })

  const followers = engagement?.followers || [];
  console.log("engagement - followers ", engagement, followers)
  // 2. Loop through followers and send notifications individually
  for (const followerId of followers) {
    const userSocket = connectedUsers.get(followerId.toString());


    console.log({ followerId })
    // Count unread notifications for this user
    const unreadCount = await Notification.countDocuments({
      receiverId: followerId,
      isRead: false,
    });

    // 3. Emit notification via socket
    if (userMsg && userSocket) {
      io.to(userSocket.socketID).emit('notification', {
        statusCode: 200,
        success: true,
        unreadCount: unreadCount + 1,
        message: userMsg,
      });
    }

    // 4. Save to DB
    const result = await Notification.create({
      userId, // sender
      receiverId: followerId, // follower is the receiver
      message: userMsg,
      type: type || 'BusinessNotification',
      sentCount: followers.length,
      notificationEventId,
      isRead: false,
      timestamp: new Date(),
    });

    const msg = userMsg?.text || "something";
  
    sendNotificationByFcmToken(followerId, msg)
  }
};


export const emitNotificationToInterestUsersOfEvent = async ({
  userId,
  userMsg,
  type,
}: {
  userId: mongoose.Types.ObjectId;
  userMsg?: {
    image?: string;
    text: string;
    name: string;
    types: string;
    notificationFor: string;
    fullName?: string;
  };
  type?: string;
}): Promise<void> => {
  if (!io) throw new Error('Socket.IO is not initialized');

  // Generate a unique ID for this notification event
  const notificationEventId = uuidv4();

  // 1. Find interest users for this event
  const interestList = await EventInterestUserList.findOne({
    eventId: userMsg?.notificationFor,
  }).select('interestUsers');

  const interestUsers = interestList?.interestUsers || [];

  // 2. Loop through interested users
  for (const interest of interestUsers) {
    const receiverId = interest.user;
    const userSocket = connectedUsers.get(receiverId.toString());

    const unreadCount = await Notification.countDocuments({
      receiverId: receiverId,
      isRead: false,
    });

    // 3. Emit socket if online
    if (userMsg && userSocket) {
      io.to(userSocket.socketID).emit('notification', {
        success: true,
        statusCode: 200,
        unreadCount: unreadCount + 1,
        message: userMsg,
      });
    }

    // 4. Save notification
    await Notification.create({
      userId, // sender
      receiverId, // receiver is the interested user
      message: userMsg,
      type: type || 'EventNotification',
      sentCount: interestUsers.length,
      notificationEventId,
      isRead: false,
      timestamp: new Date(),
    });

    const msg = userMsg?.text || "something";
  
    sendNotificationByFcmToken(receiverId, msg)
  }
};

export const emitNotificationToApplicantsOfJob = async ({
  userId,
  userMsg,
  type,
}: {
  userId: mongoose.Types.ObjectId;
  userMsg?: {
    image?: string;
    text: string;
    name: string;
    types: string;
    notificationFor: string;
    fullName?: string;
  };
  type?: string;
}): Promise<void> => {
  if (!io) throw new Error('Socket.IO is not initialized');

  // Generate a unique ID for this notification event
  const notificationEventId = uuidv4();

  // 1. Find interest users for this event
  const interestList = await EventInterestUserList.findOne({
    eventId: userMsg?.notificationFor,
  }).select('interestUsers');

  const interestUsers = interestList?.interestUsers || [];

  // 2. Loop through interested users
  for (const interest of interestUsers) {
    const receiverId = interest.user;
    const userSocket = connectedUsers.get(receiverId.toString());

    const unreadCount = await Notification.countDocuments({
      receiverId: receiverId,
      isRead: false,
    });

    // 3. Emit socket if online
    if (userMsg && userSocket) {
      io.to(userSocket.socketID).emit('notification', {
        success: true,
        statusCode: 200,
        unreadCount: unreadCount + 1,
        message: userMsg,
      });
    }

    // 4. Save notification
    await Notification.create({
      userId, // sender
      receiverId, // receiver is the interested user
      message: userMsg,
      type: type || 'JobNotification',
      sentCount: interestUsers.length,
      notificationEventId,
      isRead: false,
      timestamp: new Date(),
    });

    const msg = userMsg?.text || "something";
  
    sendNotificationByFcmToken(receiverId, msg)
  }
};


export const emitSearchNotificationToBusiness = async ({
  userId,
  receiverId,
  userMsg
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg?: { image?: string; text: string; };
}): Promise<void> => {

  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });


  // Notify the specific user
  if (userMsg && userSocket) {
    console.log();
    io.to(userSocket.socketID).emit(`notification`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });
  }


  // Save notification to the database
  const newNotification = {
    userId, // Ensure that userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure that receiverId is of type mongoose.Types.ObjectId
    message: userMsg,
    type: "adminProvide", // Use the provided type (default to "FollowRequest")
    isRead: false, // Set to false since the notification is unread initially
    timestamp: new Date(), // Timestamp of when the notification is created
  };

  // Save notification to the database
  const result = await Notification.create(newNotification);

  const msg = userMsg?.text || "something";
  
  sendNotificationByFcmToken(receiverId, msg)

};


export const emitNotificationOfReview = async ({
  userId,
  receiverId,
  userMsg,
  type,
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: string;
  userMsg?: {
    image?: string;
    text: string;
    name: string;
    types?: string;
    notificationFor?: mongoose.Types.ObjectId;
    fullName?: string;
  };
  type?: string;
}): Promise<void> => {

  if (!io) throw new Error('Socket.IO is not initialized');

    const userSocket = connectedUsers.get(receiverId.toString());

    const unreadCount = await Notification.countDocuments({
      receiverId: receiverId,
      isRead: false,
    });

    // 3. Emit socket if online
    if (userMsg && userSocket) {
      io.to(userSocket.socketID).emit('notification', {
        success: true,
        statusCode: 200,
        unreadCount: unreadCount + 1,
        message: userMsg,
      });
    }

    // 4. Save notification
    await Notification.create({
      userId, // sender
      receiverId, // receiver is the interested user
      message: userMsg,
      type: type ,
      isRead: false,
      timestamp: new Date(),
    });

    const msg = userMsg?.text || "something";
  
    sendNotificationByFcmToken(receiverId, msg)


  }


// Typing the function parameters
interface UserMessage {
  name: string;
  image?: string;
  text: string; // The main message text
}

export const emitNotificationOfSuccessfullyPamentSubcription = async ({
  userId,
  receiverId,
  userMsg,
}: {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg: UserMessage;
}): Promise<void> => {

  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });

  // Notify the specific user via Socket.IO
  if (userMsg && userSocket) {
    io.to(userSocket.socketID).emit('notification', {
      statusCode: 200,
      success: true,
      unreadCount: unreadCount + 1, // Add 1 for the new notification
    });
  }

  // Save the notification to the database
  const newNotification = {
    userId, // Ensure userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure receiverId is of type mongoose.Types.ObjectId
    message: userMsg, // The message object
    type: "adminProvide", // Default type or use the provided type
    isRead: false, // Initially unread
    timestamp: new Date(), // Timestamp when the notification is created
  };

  // Save the notification to the database
  const result = await Notification.create(newNotification);

  // Log or process the notification message if necessary
  const msg = userMsg?.text || "Something went wrong with the message"; // Fallback message
  
  // Optionally call a reminder notification function (assuming it's defined elsewhere)
  sendReminderNotification(receiverId, userMsg?.name, userMsg?.text);
};



export const emitNotificationAllBusinessUsersFromCouponOffer = async ({
  userId,
  userMsg,
  type,
}: {
  userId: string;
  userMsg?: {
    image?: string;
    text: string;
    name: string;
  };
  type?: string;
}): Promise<void> => {
  if (!io) throw new Error('Socket.IO is not initialized');

  // Ensure that userMsg exists
  if (!userMsg || !userMsg.text ) {
    throw new Error('Invalid notification message');
  }

  // 1. Find business users (change 'organizer' to the appropriate role, if necessary)
  const businessUserList = await User.find({ role: 'business' }).select('_id'); // Adjust role as needed

  console.log("businessUserList===>>> ", businessUserList)

  // 2. Loop through business users
  for (const businessUser of businessUserList) {
    const receiverId = businessUser._id; // Correctly access the user ID
    const userSocket = connectedUsers.get(receiverId.toString()); // Get the socket ID for real-time notification

    const unreadCount = await Notification.countDocuments({
      receiverId: receiverId,
      isRead: false,
    });

    // 3. Emit socket notification if user is online
    if (userMsg && userSocket) {
      io.to(userSocket.socketID).emit('notification', {
        success: true,
        statusCode: 200,
        unreadCount: unreadCount + 1,
        message: userMsg,
      });
    }

    // 4. Save the notification in the database
    await Notification.create({
      userId, // sender
      receiverId, // receiver is the business user
      message: userMsg,
      type: type || 'CouponOfferNotification', // Custom type for coupon-related notifications
      sentCount: businessUserList.length,
      isRead: false,
      timestamp: new Date(),
    });

    // 5. Send push notification via FCM (optional)
    const msg = userMsg?.text || 'New coupon offer available!';
    sendNotificationByFcmToken(receiverId, msg);
  }
};
  
export const emitOnlineUser = async (userId: string) => {
  if (!io) throw new Error('Socket.IO is not initialized');

  // 1. Find current user's friends
  const userList = await Friendship.findOne({ userId });

  if (!userList || !userList.friendship) return;

  // 2. Filter friends who are currently online
  const connectedFriends = userList.friendship.filter((friendId) =>
    connectedUsers.has(friendId.toString())
  );

  // 3. Notify each connected friend with their visible friends
  await Promise.all(
    connectedFriends.map(async (friendId: any) => {
      const friendSocket = connectedUsers.get(friendId.toString());

      if (friendSocket) {
        const friendList = await Friendship.findOne({
          userId: friendId,
        });

        if (!friendList || !friendList.friendship) return;

        const visibleFriends = friendList.friendship.filter((fId: any) =>
          connectedUsers.has(fId.toString())
        );

        const visibleFriendUserIds = visibleFriends.map((fId: any) =>
          fId.toString()
        );

        console.log(`Emitting to ${friendId}:`, visibleFriendUserIds);

        io.to(friendSocket.socketID).emit('active-users', {
          success: true,
          data: visibleFriendUserIds,
        });
      }
    })
  );

  const connectedFriendUserIds = connectedFriends.map((id) => id.toString());

  return { success: true, data: connectedFriendUserIds };
};


interface NotificationMessage {
  image?: string;
  name: string;
  text: string;
}

interface EmitReminderNotificationParams {
  userId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  userMsg: NotificationMessage;
}

export const emitReminderNotificationToBusinessUser = async ({
  userId,
  receiverId,
  userMsg
}: EmitReminderNotificationParams): Promise<void> => {

  if (!io) {
    throw new Error('Socket.IO is not initialized');
  }

  // Get the socket ID of the specific user
  const userSocket = connectedUsers.get(receiverId.toString());

  // Fetch unread notifications count for the receiver before creating the new notification
  const unreadCount = await Notification.countDocuments({
    receiverId: receiverId,
    isRead: false, // Filter by unread notifications
  });


  // Notify the specific user
  if (userMsg && userSocket) {
    console.log();
    io.to(userSocket.socketID).emit(`notification`, {
      // userId,
      // message: userMsg,
      statusCode: 200,
      success: true,
      unreadCount: unreadCount >= 0 ? unreadCount + 1 : 1,
    });
  }


  // Save notification to the database
  const newNotification = {
    userId, // Ensure that userId is of type mongoose.Types.ObjectId
    receiverId, // Ensure that receiverId is of type mongoose.Types.ObjectId
    message: userMsg,
    type: "adminProvide", // Use the provided type (default to "FollowRequest")
    isRead: false, // Set to false since the notification is unread initially
    timestamp: new Date(), // Timestamp of when the notification is created
  };

  // Save notification to the database
  const result = await Notification.create(newNotification);

  const msg = userMsg?.text || "something";
  
  sendReminderNotification(receiverId, userMsg?.name, userMsg?.text)

};

