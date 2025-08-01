import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { mySubscriptionService } from "./mySubscription.service";

const getMySubscriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; // Adjust depending on your auth logic
  const result = await mySubscriptionService.getMySubscriptions(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My subscriptions retrieved successfully",
    data: result,
  });
});

const activateSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {userId} = req.user;
  const result = await mySubscriptionService.activateSubscription(userId, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription activated successfully",
    data: result,
  });
});

const stopSubscription = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {userId} = req.user;
  const result = await mySubscriptionService.stopSubscription(userId, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription stopped successfully",
    data: result,
  });
});

export const mySubscriptionController = {
    getMySubscriptions,
    activateSubscription,
    stopSubscription
}