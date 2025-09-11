import { Request, Response } from 'express';
import { messageService } from './message.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { IChat } from '../chat/chat.interface';
import Chat from '../chat/chat.model';
import AppError from '../../error/AppError';
import { ChatService } from '../chat/chat.service';
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const {text, chatId} = req.body;
  const {userId} = req.user;

    // Validate input data
    if (!text || !chatId) {
       res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Text and chatId are required',
      });
    }
  

  const msgData ={
    text,
    sender: userId,
    chat: chatId
  }
  const result = await messageService.sendMessage(msgData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const fileUpload = catchAsync(async (req: Request, res: Response) => {

    let result;
    if (req.files) {
      try {
        
        const uploadedFiles = await uploadMultipleFilesToS3(
          req.files as { [fieldName: string]: Express.Multer.File[] }
        );
  
  
        if (uploadedFiles.images?.length) {
          result = uploadedFiles.images;
        }
  
      } catch (error: any) {
        console.error('Error processing files:', error.message);
        return sendResponse(res, {
          statusCode: httpStatus.BAD_REQUEST,
          success: false,
          message: 'Failed to process uploaded files',
          data: null,
        });
      }
    }
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'file upload successfully',
    data: result,
  });
});

const updateMessage = catchAsync(async (req: Request, res: Response) => {
  const {text} = req.body;
  const {userId} = req.user;
  const {msgId} = req.params;

    // Validate input data
    if (!text) {
       res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Text are required',
      });
    }
  

  const msgUpdateData ={
    userId,
    text,
    msgId
  }
  const result = await messageService.updateMessage(msgUpdateData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});


//seen messages
const seenMessage = catchAsync(async (req: Request, res: Response) => {
  const chatList: IChat | null = await Chat.findById(req.params.chatId);

  if (!chatList) {
    throw new AppError(httpStatus.BAD_REQUEST, 'chat id is not valid');
  }

  console.log({chatList})
  console.log("user id ->>>  ", req.user.userId)

  const result = await messageService.seenMessage(
    req.user.userId,
    req.params.chatId,
  );

  console.log("=== result ===>>> ", result)



  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Message seen successfully',
    data: result,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const {msgId} = req.params
  const result = await messageService.deleteMessage({userId, msgId});
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  });
})

const getMessagesForChat = catchAsync(async (req: Request, res: Response) => {
  const result = await messageService.getMessagesForChat(req.params.chatId);

  console.log("result ",{result})
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: result,
    message: 'Messages fetched successfully',
  });
});


const getUnreadMessageCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; // ✅ ধরলাম authentication middleware ইউজার সেট করে দিচ্ছে

  const count = await messageService.getUnreadMessageCount(userId);
console.log({count})
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unread message count fetched successfully",
    data: { count },
  });
});

export const messageController = {
  sendMessage,
  fileUpload,
  getMessagesForChat,
  updateMessage,
  seenMessage,
  deleteMessage,
  getUnreadMessageCount
};
