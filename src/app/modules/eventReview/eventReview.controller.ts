import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventReviewService } from './eventReview.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const payload = {
    ...req.body,
    userId
  };

  const result = await eventReviewService.createReview(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Event review submitted successfully',
    data: result
  });
});

const getReviewsByEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await eventReviewService.getReviewsByEvent(req.params.eventId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event reviews fetched successfully',
    data: result
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const reviewId = req.params.id;

  const result = await eventReviewService.deleteReview(reviewId, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null
  });
});

export const eventReviewController = {
  createReview,
  getReviewsByEvent,
  deleteReview
};
