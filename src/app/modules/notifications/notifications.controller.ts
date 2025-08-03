 import { Request, Response } from 'express';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { notificationService } from './notifications.service';
import { emitNotificationToApplicantsOfJob, emitNotificationToFollowersOfBusiness, emitNotificationToInterestUsersOfEvent } from '../../../socketIo';
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

const sentNotificationToFollowersOfBusiness = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { message, type } = req.body;

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

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.getAllNotifications(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All notifications fetched successfully!',
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
  getAllNotifications,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sentNotificationToFollowersOfBusiness,
  sentNotificationToInterestedUsersOfEvent,
  sentNotificationToApplicantsOfJob
};
