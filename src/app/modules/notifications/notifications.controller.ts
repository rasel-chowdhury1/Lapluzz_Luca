 import { Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { notificationService } from './notifications.service';
import { emitDirectNotification, emitNotificationToApplicantsOfJob, emitNotificationToFollowersOfBusiness, emitNotificationToInterestUsersOfEvent, emitSearchNotificationToBusiness } from '../../../socketIo';
import mongoose from 'mongoose';

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const {receiverId, message, type } = req.body;
  const result = await notificationService.createNotification({ userId, receiverId, message, type });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Notification created successfully',
    data: result,
  });
});

const sentNotificationToDirect = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  console.log(req.body)
  const { message, receiverId } = req.body;

  await emitDirectNotification({
    userId: new mongoose.Types.ObjectId(userId),
    receiverId,
    userMsg: message
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Direct notification sent successfully to the specified user',
    data: null,
  });
});

const sentNotificationToFollowersOfBusiness = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { message, type } = req.body;


  const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
    if (todayCount >= 3) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You have already sent the maximum of 3 notifications today.',
      data: null,
    });
  }

  await emitNotificationToFollowersOfBusiness({
    userId: new mongoose.Types.ObjectId(userId),
    userMsg: message,
    type: type || 'BusinessNotification', // Default fallback
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications sent to all followers of the business',
    data: null,
  });
});

const sentNotificationToInterestedUsersOfEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { message, type } = req.body;

    const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
    if (todayCount >= 3) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You have already sent the maximum of 3 notifications today.',
      data: null,
    });
  }

  await emitNotificationToInterestUsersOfEvent({
    userId: new mongoose.Types.ObjectId(userId),
    userMsg: message,
    type: type || 'EventNotification', // Default fallback
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications sent to all interested users of the event',
    data: null,
  });
});

const sentNotificationToApplicantsOfJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { message, type } = req.body;

    const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
    if (todayCount >= 3) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'You have already sent the maximum of 3 notifications today.',
      data: null,
    });
  }

  await emitNotificationToApplicantsOfJob({
    userId: new mongoose.Types.ObjectId(userId),
    userMsg: message,
    type: type || 'JobNotification', // Default fallback
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications sent to all applicants of the job',
    data: null,
  });
});

const sentSearchNotificationToBusinesses = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  console.log(req.body);
  const { message, receiverIds } = req.body;

  if (Array.isArray(receiverIds) && receiverIds.length > 0) {
    await Promise.all(
      receiverIds.map(async (receiver) => {
        await emitSearchNotificationToBusiness({
          userId: new mongoose.Types.ObjectId(userId),
          receiverId: receiver,
          userMsg: message
        });
      })
    );
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Search notifications sent successfully to the selected businesses',
    data: null,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.getAllNotifications(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All notifications fetched successfully!',
  });
});

const sentNotificationToMass = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user.userId; // Current logged-in user

  const { location, rangeKm, category, message } = req.body;

  const result = await notificationService.sendMassNotification({
    location,
    rangeKm,
    category,
    message,
    senderId,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Mass notification sent to ${result.count} receivers`,
    data: result, // Contains count & receivers list
  });
});

const getMassNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.getMassNotifications();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'Mass notifications fetched successfully!',
  });
});

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await notificationService.getMyNotifications(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'My notifications fetched successfully!',
  });
});

const getMySentedNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const result = await notificationService.getMySentedNotifications(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'My sented notifications fetched successfully!',
  });
});

const getTodayHowManySentNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const count = await notificationService.getTodayHowManySentNotifications(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: { count },
    message: 'Total notifications sent to you today retrieved successfully!',
  });
});


const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await notificationService.markAsRead(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification marked as read successfully!',
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const result = await notificationService.markAllAsRead(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification marked as read successfully!',
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await notificationService.deleteNotification(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification deleted successfully!',
    data: result,
  });
});

export const notificationController = {
  createNotification,
  sentNotificationToMass,
  getAllNotifications,
  getMyNotifications,
  getMySentedNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getTodayHowManySentNotifications,
  sentNotificationToFollowersOfBusiness,
  sentNotificationToInterestedUsersOfEvent,
  sentNotificationToApplicantsOfJob,
  sentNotificationToDirect,
  sentSearchNotificationToBusinesses,
  getMassNotifications
};
