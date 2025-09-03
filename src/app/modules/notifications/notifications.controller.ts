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

  console.log(" sent notification to followers of buseiness ==>>> ", req.body);
  const { message, type } = req.body;


  // const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
  //   if (todayCount >= 3) {
  //   return sendResponse(res, {
  //     statusCode: httpStatus.BAD_REQUEST,
  //     success: false,
  //     message: 'You have already sent the maximum of 3 notifications today.',
  //     data: null,
  //   });
  // }

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

  console.log(" sent notification to followers of event ==>>> ", req.body);
  const { message, type } = req.body;

  //   const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
  //   if (todayCount >= 3) {
  //   return sendResponse(res, {
  //     statusCode: httpStatus.BAD_REQUEST,
  //     success: false,
  //     message: 'You have already sent the maximum of 3 notifications today.',
  //     data: null,
  //   });
  // }

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
  console.log(" sent notification to followers of job ==>>> ", req.body);
  const { message, type } = req.body;

  //   const todayCount = await notificationService.getTodayHowManySentNotifications(userId);
  //   if (todayCount >= 3) {
  //   return sendResponse(res, {
  //     statusCode: httpStatus.BAD_REQUEST,
  //     success: false,
  //     message: 'You have already sent the maximum of 3 notifications today.',
  //     data: null,
  //   });
  // }

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

const getMySentedSpecificBusinessNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const {id} = req.params;
  const result = await notificationService.getMySentedNotificationsByTypeAndId(userId, "business", id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'My sented notifications fetched successfully!',
  });
});

const getMySentedSpecificEventNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const {id} = req.params;
  const result = await notificationService.getMySentedNotificationsByTypeAndId(userId, "event", id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'My sented notifications fetched successfully!',
  });
});

const getMySentedSpecificJobNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const {id} = req.params;
  const result = await notificationService.getMySentedNotificationsByTypeAndId(userId, "job", id);

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

const getTodayHowManySentNotificationsBusinessById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;  // Get the userId from the request object (assumed to be added by middleware)
  const { businessId } = req.params;        // Extract the business ID from the request parameters

  // Get the count of total sent notifications of type 'business' for the specific user and business ID
  const count = await notificationService.getTotalSentNotificationsByTypeAndId(userId, 'business', businessId);

  // Send the response with the count of notifications
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: { count },
    message: `Successfully retrieved the total number of business notifications sent to you today!`,
  });
});

const getTodayHowManySentNotificationsEventById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;  // Get the userId from the request object (assumed to be added by middleware)
  const { eventId } = req.params;        // Extract the event ID from the request parameters

  // Check for missing or invalid user ID
  if (!userId) {
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'User ID is missing or invalid.',
      data: null
    });
  }

  // Check for missing event ID
  if (!eventId) {
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Event ID is required.',
      data: null
    });
  }

  // Get the count of total sent notifications of type 'event' for the specific user and event ID
  const count = await notificationService.getTotalSentNotificationsByTypeAndId(userId, 'event', eventId);

  if (count === 0) {
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      data: { count },
      message: `No event notifications have been sent to you today.`,
    });
  }

  // Send the response with the count of notifications
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: { count },
    message: `Successfully retrieved the total number of event notifications sent to you today!`,
  });
});

const getTodayHowManySentNotificationsJobById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;  // Get the userId from the request object (assumed to be added by middleware)
  const { jobId } = req.params;        // Extract the job ID from the request parameters

  // Check for missing or invalid user ID
  if (!userId) {
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'User ID is missing or invalid.',
      data: null
    });
  }

  // Check for missing job ID
  if (!jobId) {
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: 'Job ID is required.',
      data: null
    });
  }

  // Get the count of total sent notifications of type 'job' for the specific user and job ID
  const count = await notificationService.getTotalSentNotificationsByTypeAndId(userId, 'job', jobId);

  if (count === 0) {
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      data: { count },
      message: `No job notifications have been sent to you today.`,
    });
  }

  // Send the response with the count of notifications
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: { count },
    message: `Successfully retrieved the total number of job notifications sent to you today!`,
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

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const result = await notificationService.getUnreadCount(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Notification unread count fetched successfully!',
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
  getUnreadCount,
  getMassNotifications,
  getTodayHowManySentNotificationsBusinessById,
  getTodayHowManySentNotificationsEventById,
  getTodayHowManySentNotificationsJobById,
  getMySentedSpecificBusinessNotifications,
  getMySentedSpecificEventNotifications,
  getMySentedSpecificJobNotifications
};
