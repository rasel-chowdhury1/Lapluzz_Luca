import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { EventInterestService } from './eventInterest.service';

const addUserInterest = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const userId = req.user.userId; // Assuming req.user is populated

  const result = await EventInterestService.addInterestUser(eventId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User interest recorded successfully',
    data: result,
  });
});

const getInterestedUsers = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const result = await EventInterestService.getInterestUsers(eventId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fetched interested users successfully',
    data: result,
  });
});


export const EventInterestController = {
    addUserInterest,
    getInterestedUsers
}