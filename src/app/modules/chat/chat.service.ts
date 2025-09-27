import mongoose from 'mongoose';
import { connectedUsers, emitNotificationOfReview } from '../../../socketIo';
import AppError from '../../error/AppError';
// import GroupChat from '../groupChat/groupChat.model';
import Message from '../message/message.model';
import { User } from '../user/user.models';
import { IChat } from './chat.interface';
import Chat from './chat.model';
import httpStatus from 'http-status';
import { ensureFriendship } from './chat.utils';
// Convert string to ObjectId
const toObjectId = (id: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(id);



const addNewChat = async (userId: string, chatData: IChat) => {
    // Check if the creator exists
    const isCreatorExist = await User.findById(chatData.createdBy);
    if (!isCreatorExist) {
      throw new Error('Creator not found');
    }

    // Check if another user in the chat exists
    const anotherUser = await User.findById(chatData.users[0]);
    if (!anotherUser) {
      throw new Error('Another user not found');
    }

    // Build the query for finding existing chats
    const chatQuery: any = {
      users: { $all: chatData.users, $size: 2 }, // Ensure both users are in the chat
    };

    // Add context-specific filters if present
    if (chatData.contextType && chatData.contextId) {
      chatQuery.contextType = chatData.contextType;
      chatQuery.contextId = chatData.contextId;
      chatQuery.status = "open";
    } else if (chatData.contextType && !chatData.contextId) {
      throw new Error('contextId must be provided when contextType is set');
    } else {
      chatQuery.isGroupChat = false; // For individual chats, ensure it's not a group chat
    }

    // Find existing chat based on the query
    const existingChat = await Chat.findOne(chatQuery).populate({
      path: 'users',
      select: 'sureName name email profileImage', // Select only necessary fields
    });

    // If an existing chat is found, return it with the current user excluded
    if (existingChat) {
      const filteredUsers = existingChat.users.filter(
        (user: any) => user._id.toString() !== userId.toString()
      );

      return {
        ...existingChat.toObject(),
        users: filteredUsers,
      };
    }



       // Create the new chat in the database
  const newChat = new Chat({
    ...chatData,
    createdBy: userId, // Set the createdBy field to the current userId
    ...(chatData.contextId && { chatType: 'custom' }),
  });

  // Save the chat to the database
  const savedChat = await newChat.save();



  // Populate the users for the newly created chat
  const populatedResult = await Chat.findById(savedChat._id).populate({
    path: 'users',
    select: 'sureName name email profileImage',
  });

  // Exclude the current user from the response
  const filteredUsers = populatedResult?.users.filter(
    (user: any) => user._id.toString() !== userId.toString()
  );

  return {
    ...populatedResult?.toObject(),
    users: filteredUsers,
  };
};

// =========== deal close by chat id  ===========
const dealCloseByChatById = async (userId: string, chatId: string, profileImage: string) => {
  try {
    // 1. Check if chat exists
    const isExistChat = await Chat.findById(chatId).exec();
    if (!isExistChat) {
      throw new AppError(httpStatus.NOT_FOUND, 'Chat not found');
    }

    // 2. Check if the current user is the contextOwner
    if (isExistChat.contextOwner && isExistChat.contextOwner.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not authorized to close this chat');
    }

    // 3. Update chat status to "closed"
    await Chat.findByIdAndUpdate(chatId, { status: 'closed' }).exec();

    // 4. Determine the other user in the chat (the receiver)
    const receiverId = userId !== isExistChat.users[0].toString()
      ? isExistChat.users[0]
      : isExistChat.users[1];
 

       const contextId = isExistChat?.contextId ? new mongoose.Types.ObjectId((isExistChat as any)?.contextId) : undefined;
    // 5. Prepare the notification message
    const userMsg = {
      image: profileImage,
      text: `✅ Deal closed! You can now leave feedback for ${isExistChat.chatName}`,
      name: isExistChat.chatName,
      types: isExistChat.contextType,
      notificationFor: contextId, // Represents the action or event type
      fullName: '', // optional, can be added if needed
    };

    // 6. Emit the notification to the receiver
    await emitNotificationOfReview({
      userId: new mongoose.Types.ObjectId(userId),
      receiverId: receiverId.toString(),
      userMsg,
      type: 'review',
    });

    // 7. Return success message
    return {
      success: true,
      message: 'Chat successfully closed and notification sent to the receiver.',
    };
  } catch (error) {
    // Handle unexpected errors
    console.error('Error closing chat:', error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'An error occurred while trying to close the chat');
  }
};

// =========== Get my chat list start ===========
const getMyChatList = async (userId: string, query: any) => {
  // Build the query object to filter the chats
  const filterQuery: any = { users: { $all: userId } };

  // Fetch chats based on the filterQuery, populate user details
  const chats = await Chat.find(filterQuery).populate({
    path: 'users',
    select: 'fullName email profileImage _id role name sureName',
    match: { _id: { $ne: userId } },
  });

  if (!chats) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Chat list not found');
  }

  const data = [];
  for (const chatItem of chats) {
    if (!chatItem.users.length) continue;

    const chatId = chatItem?._id;

    // If this is a group chat, populate the groupChatId
    if (chatItem.isGroupChat) {
      await chatItem.populate('groupChatId');
    }

    let users;
    // Check if a search query exists and filter users
    if (query.search) {
      users = chatItem.users.filter((user) => {
        return (user as any)?.fullName
          .toLowerCase()
          .includes(query.search.toLowerCase());
      });
      if (!users?.length) continue;
    }

    // Find the latest message in the chat
    const message: any = await Message.findOne({ chat: chatId }).sort({
      updatedAt: -1,
    });

    const unreadMessageCount = await Message.countDocuments({
      chat: chatId,
      seen: false,
      sender: { $ne: userId },
    });

    if (message) {
      data.push({
        chat: chatItem,
        message: message.text,
        unreadMessageCount,
        lastMessageCreatedAt: message.updatedAt,
      });
    } else {
      data.push({
        chat: chatItem,
        message: message || null,
        unreadMessageCount,
        lastMessageCreatedAt: null,
      });
    }
  }

  // data.sort((a, b) => {
  //   const dateA = (a.message && a.message.createdAt) || 0;
  //   const dateB = (b.message && b.message.createdAt) || 0;
  //   return dateB - dateA;
  // });

    // Sorting the data by lastMessageCreatedAt
    data.sort((a, b) => {
    // Prioritize "support" chatType but only if status is not "closed"
    if (a.chat.status !== "closed" && a.chat.chatType === 'support' && (b.chat.status === "closed" || b.chat.chatType !== 'support')) {
      return -1; // "support" chats come first unless status is closed
    }
    if (b.chat.status !== "closed" && b.chat.chatType === 'support' && (a.chat.status === "closed" || a.chat.chatType !== 'support')) {
      return 1; // "support" chats come first unless status is closed
    }
      const dateA = a.lastMessageCreatedAt ? new Date(a.lastMessageCreatedAt).getTime() : 0;
      const dateB = b.lastMessageCreatedAt ? new Date(b.lastMessageCreatedAt).getTime() : 0;
      return dateB - dateA;  // Sort in descending order
    });

  return data;
};



const getChatById = async (chatId: string) => {
  const result = await Chat.findById(chatId);

  // If no chat is found, throw an AppError
  if (!result) {
    // throw new AppError(httpStatus.NOT_FOUND, 'Chat not found');
    return null;
  }

  return result;
};


const leaveUserFromSpecific = async (payload: any) => {
  const { chatId, userId, fullName } = payload; // Expect chatId and userId in the payload

  // Check if chatId is provided
  if (!chatId) {
    throw new Error('Chat ID is required'); // Throw an error for the caller to handle
  }

  // Check if userId is provided
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Find the chat
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new Error('Chat not found');
  }

  // Check if the user is part of the chat
  if (!chat.users.includes(userId)) {
    throw new Error('You are not part of this chat');
  }

  // // Remove the user from the chat
  chat.users = chat.users.filter((user) => user.toString() !== userId);


  // // Save the updated chat
  await chat.save();

  await Message.create({
    sender: userId,
    text: `${fullName} has left the chat`,
    isLeft: true,
    chat: chatId,
  });

  // Return success message
  return 'User has left the chat successfully';
};



export const ChatService = {
  addNewChat,
  dealCloseByChatById,
  getMyChatList,
  getChatById,
  leaveUserFromSpecific,
};
