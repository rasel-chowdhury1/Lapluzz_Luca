import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { businessProfileViewsService } from './businessProfileViews.service';

const addView = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId } = req.body;

  const result = await businessProfileViewsService.addView(businessId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business view added',
    data: result
  });
});

const getViewsByBusiness = catchAsync(async (req: Request, res: Response) => {
  const { businessId } = req.params;

  const result = await businessProfileViewsService.getViewsByBusiness(businessId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business views retrieved',
    data: result
  });
});

export const businessProfileViewsController = {
  addView,
  getViewsByBusiness
};
