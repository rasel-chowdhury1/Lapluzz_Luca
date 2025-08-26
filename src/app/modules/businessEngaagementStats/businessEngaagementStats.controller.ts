import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { businessEngagementStatsService } from './businessEngaagementStats.service';

const like = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId } = req.body;

  const result = await businessEngagementStatsService.likeBusiness(businessId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business liked',
    data: result
  });
});

const unlike = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId } = req.body;

  const result = await businessEngagementStatsService.unlikeBusiness(businessId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business unliked',
    data: result
  });
});

const follow = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId } = req.body;

  const result = await businessEngagementStatsService.followBusiness(businessId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business followed',
    data: result
  });
});

const unfollow = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId } = req.body;

  const result = await businessEngagementStatsService.unfollowBusiness(businessId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business unfollowed',
    data: result
  });
});

const comment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { businessId, text } = req.body;

  const result = await businessEngagementStatsService.commentBusiness(businessId, userId, text);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Comment added',
    data: result
  });
});

const replyCommentofSpecificComment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // Extract the user ID from the request user object
  const { businessId, commentId, text } = req.body; // Extract businessId, commentId, and reply text from the request body

  // Check if any required fields are missing
    if (!businessId || !commentId || !text) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: 'Business ID, Comment ID, and reply text are required.',
        data: ""
      });
    }

  // Call the service to reply to the comment
  const result = await businessEngagementStatsService.replyCommentofSpecificComment(businessId, commentId, userId, text);

  // Send a response indicating that the reply was successfully added
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Reply to the comment was successfully added', // Clear and meaningful message
    data: result
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await businessEngagementStatsService.getStats(req.params.businessId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Engagement stats fetched',
    data: result
  });
});


const getBusinessComments = catchAsync(async (req: Request, res: Response) => {
  const result = await businessEngagementStatsService.getBusinessComments(req.params.businessId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific business comments fetched',
    data: result
  });
});

export const businessEngagementStatsController = {
  like,
  unlike,
  follow,
  unfollow,
  comment,
  getStats,
  getBusinessComments,
  replyCommentofSpecificComment
};
