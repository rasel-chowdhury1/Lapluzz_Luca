import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { jobProfileViewsService } from './jobProfileViews.service';

const addView = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { jobId } = req.body;

  const result = await jobProfileViewsService.addView(jobId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job profile view added',
    data: result
  });
});

const getViewsByJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const result = await jobProfileViewsService.getViewsByJob(jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job profile views fetched',
    data: result
  });
});

export const jobProfileViewsController = {
  addView,
  getViewsByJob
};
