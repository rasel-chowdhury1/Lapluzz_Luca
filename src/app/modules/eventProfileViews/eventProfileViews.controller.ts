import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventProfileViewsService } from './eventProfileViews.service';

const addView = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { eventId } = req.body;

  const result = await eventProfileViewsService.addView(eventId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'View recorded successfully',
    data: result
  });
});

const getViews = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const result = await eventProfileViewsService.getViewsByEvent(eventId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event views fetched successfully',
    data: result
  });
});

export const eventProfileViewsController = {
  addView,
  getViews
};
