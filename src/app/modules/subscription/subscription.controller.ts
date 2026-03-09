import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { SubscriptionService } from './subscription.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

export const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.createSubscription(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription created successfully',
    data: result,
  });
});


export const updateSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const { subId } = req.params;
  const result = await SubscriptionService.updateSubscriptionById(subId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription updated successfully',
    data: result,
  });
});

export const getAllSubscriptions = catchAsync(async (_req: Request, res: Response) => {
  const result = await SubscriptionService.getAllSubscriptions();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All subscriptions retrieved successfully',
    data: result,
  });
});

export const getSubscriptionsByType = catchAsync(async (req: Request, res: Response) => {
  const type = req.params.type;
  const result = await SubscriptionService.getSubscriptionsByType(type);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Subscriptions for type '${type}' retrieved successfully`,
    data: result,
  });
});

export const getSubscriptionById = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.getSubscriptionById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result,
  });
});

export const deleteSubscription = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.deleteSubscription(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription deleted successfully',
    data: result,
  });
});
