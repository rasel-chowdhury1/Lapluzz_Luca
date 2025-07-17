import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { jobReviewService } from './jobReview.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const payload = {
    ...req.body,
    userId
  };

  const result = await jobReviewService.createReview(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review submitted successfully',
    data: result
  });
});

const getReviewsByJob = catchAsync(async (req: Request, res: Response) => {
  const jobId = req.params.jobId;
  const result = await jobReviewService.getReviewsByJob(jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews fetched successfully',
    data: result
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const reviewId = req.params.id;
  const { userId } = req.user;

  const result = await jobReviewService.deleteReview(reviewId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null
  });
});

export const jobReviewController = {
  createReview,
  getReviewsByJob,
  deleteReview
};
