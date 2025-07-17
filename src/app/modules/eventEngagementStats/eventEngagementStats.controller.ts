import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventEngagementStatsService } from './eventEngagementStats.service';

const like = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { eventId } = req.body;

  const result = await eventEngagementStatsService.likeEvent(eventId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event liked',
    data: result
  });
});

const unlike = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { eventId } = req.body;

  const result = await eventEngagementStatsService.unlikeEvent(eventId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event unliked',
    data: result
  });
});

const comment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { eventId, text } = req.body;

  const result = await eventEngagementStatsService.addComment(eventId, userId, text);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Comment added',
    data: result
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await eventEngagementStatsService.getStats(req.params.eventId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Engagement stats fetched',
    data: result
  });
});


const getEventComments = catchAsync(async (req: Request, res: Response) => {
  const result = await eventEngagementStatsService.getEventComments(req.params.eventId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific event comments fetched',
    data: result
  });
});

export const eventEngagementStatsController = {
  like,
  unlike,
  comment,
  getStats,
  getEventComments
};
