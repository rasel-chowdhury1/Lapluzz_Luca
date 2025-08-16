import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { jobEngagementStatsService } from './jobEngagementStats.service';

const addComment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { jobId, text } = req.body;

  const result = await jobEngagementStatsService.addComment(jobId, userId, text);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Comment added successfully',
    data: result
  });
});

const getJobComments = catchAsync(async (req: Request, res: Response) => {
  const result = await jobEngagementStatsService.getJobComments(req.params.jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific job comments fetched',
    data: result
  });
});


const getEngagementStats = catchAsync(async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  const result = await jobEngagementStatsService.getEngagementStats(jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job engagement stats fetched successfully',
    data: result
  });
});

export const jobEngagementStatsController = {
  addComment,
  getEngagementStats,
  getJobComments
};
