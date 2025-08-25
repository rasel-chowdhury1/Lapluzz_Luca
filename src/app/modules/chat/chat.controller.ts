import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { storeFile } from '../../utils/fileHelper';
import sendResponse from '../../utils/sendResponse';
import { ChatService } from './chat.service';
import Business from '../business/business.model';
import Job from '../job/job.model';

const addNewChat = catchAsync(async (req: Request, res: Response) => {
  const { userId, fullName } = req.user;
  const { users = [], isGroupChat = false, contextType, contextId } = req.body;

  // Ensure the current userId is included in the `users` array if not already present
  if (!users.includes(userId)) {
    users.push(userId); // Add the current userId to the users array
  }

  // Check if the users array has exactly 2 users
  if (users.length !== 2) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Chat can only be created with exactly two users.',
      data: '',
    });
  }

  // Validate contextType and contextId
  const validContextTypes = ['business', 'event', 'job'];
  if (contextType && !validContextTypes.includes(contextType)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid contextType provided',
      data: '',
    });
  }

  if (contextType && !contextId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'contextId must be provided when contextType is set',
      data: '',
    });
  }

  // Validate contextId based on contextType
  const contextValidationMap: { [key: string]: any } = {
    business: Business,
    event: Event,
    job: Job,
  };

  if (contextType) {
    const contextModel = contextValidationMap[contextType];
    const context = await contextModel.findById(contextId);
    
    if (!context) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: `Invalid contextId for ${contextType}.`,
        data: '',
      });
    }

    req.body.contextOwner = context.author;
  }

  // Prepare chat data to be saved
  const chatData = {
    ...req.body,
    userName: fullName,
    createdBy: userId,
    users, // Modified users array
    isGroupChat, // Group chat status
  };

  console.log('chat data ====>>>> ', { chatData });

  // Call the service to add the new chat
  const result = await ChatService.addNewChat(userId, chatData);

  // Send response after chat is created
  return sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Chat is created successfully!',
    data: result,
  });
});






// const getUserChats = catchAsync(async (req: Request, res: Response) => {
//   const {userId} = req.user;
//   const chats = await ChatService.getUserChats(userId);

//     console.log("==== chats list =====>>>>>>> ", chats)
//     res.status(200).json({
//       success: true,
//       message: 'Chats retrieved successfully!',
//       data: chats,
//     });
// });




const getMyChatList = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  const result = await ChatService.getMyChatList(userId, req.query);
  
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Chat retrieved successfully',
    data: result,
  });
});



const dealCloseByChatById = catchAsync(async (req: Request, res: Response) => {
  const { userId, profileImage } = req.user;
  const { chatId } = req.params;

  // Call the service to close the deal by chat ID
  const result = await ChatService.dealCloseByChatById(userId, chatId, profileImage);

  // Send a success response with a meaningful message
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'The chat has been successfully closed. The deal is now complete and no further action is needed.',
    data: result,
  });
});

// const getConnectionUsersOfSpecificUser = catchAsync(
//   async (req: Request, res: Response) => {
//     const { userId } = req.user;

//     const {searchTerm} = req.query

//     const result = await ChatService.getConnectionUsersOfSpecificUser(userId, searchTerm);

//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'Chat ActiveUsers retrieved successfully',
//       data: result,
//     });
//   },
// );

// const getOnlineConnectionUsersOfSpecificUser = catchAsync(
//   async (req: Request, res: Response) => {
//     const { userId } = req.user;

//     const result =
//       await ChatService.getOnlineConnectionUsersOfSpecificUser(userId);
//     sendResponse(res, {
//       statusCode: 200,
//       success: true,
//       message: 'Chat online users retrieved successfully',
//       data: result,
//     });
//   },
// );

const leaveUserFromSpecificChatController = catchAsync(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const { userId, fullName } = req.user;

    console.log('req user = > ', req.user);
    const payload = {
      chatId,
      userId,
      fullName,
    };

    console.log('payload ---->>> ', payload);

    const result = await ChatService.leaveUserFromSpecific(payload);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: `${fullName} has left the chat`,
      data: result,
    });
  },
);

// const updateChatById = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   // const UserProfileData = req.body;
//   // const file = req?.file as Express.Multer.File;

//   const chatUpdateData = { ...req.body };
//   if (req?.file) {
//     chatUpdateData.groupProfilePicture = storeFile('profile', req?.file?.filename);
//   }

//   const result = await ChatService.updateChatById(id, chatUpdateData);
//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     success: true,
//     message: 'New UserProfile added successfully!',
//     data: result,
//   });
// });

const getChatById = async (req: Request, res: Response, next: NextFunction) => {
  const chat = await ChatService.getChatById(req.params.chatId);
  res.status(200).json({
    success: true,
    message: 'Chat retrieved successfully!',
    data: chat,
  });
};

// const updateUnreadCounts = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { id } = req.params;
//     const { userId, unreadCount } = req.body;
//     const updatedChat = await ChatService.updateUnreadCounts(
//       id,
//       userId,
//       unreadCount,
//     );
//     res.status(200).json({
//       success: true,
//       message: 'Unread counts updated successfully!',
//       data: updatedChat,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // Block a user
// const blockUser = catchAsync(async (req: Request, res: Response) => {
//   const { chatId } = req.params;
//   const {blockUserId} = req.body;
//   const userId = req.user.userId;

//   const result = await ChatService.blockUser(chatId, userId, blockUserId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'User blocked successfully!',
//     data: result,
//   });
// });

// // Unblock a user
// const unblockUser = catchAsync(async (req: Request, res: Response) => {
//   const { chatId } = req.params;
//   const { blockUserId } = req.body;
//   const userId = req.user.userId;

//   const result = await ChatService.unblockUser(chatId, userId, blockUserId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'User unblocked successfully!',
//     data: result,
//   });
// });

// // Delete a chat for a user (soft delete)
// const deleteChatForUser = catchAsync(async (req: Request, res: Response) => {
//   const { chatId } = req.params;
//   const {userId} = req.user;

//   const result = await ChatService.deleteChatForUser(chatId, userId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Chat deleted successfully!',
//     data: result,
//   });
// });

// const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const chat = await ChatService.deleteChat(req.params.id);
//     res.status(200).json({
//       success: true,
//       message: 'Chat deleted successfully!',
//       data: chat,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const ChatController = {
  addNewChat,
  dealCloseByChatById,
  // getUserChats,
  // getConnectionUsersOfSpecificUser,
  // getOnlineConnectionUsersOfSpecificUser,
  getMyChatList,
  getChatById,
  leaveUserFromSpecificChatController,
  //   getUserChats,
  //   getChatById,
  //   updateUnreadCounts,
  //   deleteChat,
  //   updateChatById,
  //   blockUser,
  //   unblockUser,
  //   deleteChatForUser,
};
