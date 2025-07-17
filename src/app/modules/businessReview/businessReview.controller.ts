import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { businessReviewService } from './businessReview.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const payload = {
    ...req.body,
    userId
  };

  const result = await businessReviewService.createReview(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Business review submitted successfully',
    data: result
  });
});

const getReviewsByBusiness = catchAsync(async (req: Request, res: Response) => {
  const businessId = req.params.businessId;
  const result = await businessReviewService.getReviewsByBusiness(businessId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business reviews fetched successfully',
    data: result
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.id;
  const { userId } = req.user;

  const result = await businessReviewService.deleteReview(reviewId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null
  });
});

export const businessReviewController = {
  createReview,
  getReviewsByBusiness,
  deleteReview
};
