import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { postCommunityEngagementStatsService } from './postCommunityEngagementStats.service';

const like = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { postId } = req.body;

  const result = await postCommunityEngagementStatsService.likePost(postId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Post liked',
    data: result
  });
});

const unlike = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { postId } = req.body;

  const result = await postCommunityEngagementStatsService.unlikePost(postId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Post unliked',
    data: result
  });
});

const comment = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { postId, text } = req.body;

  const result = await postCommunityEngagementStatsService.addComment(postId, userId, text);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Comment added',
    data: result
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await postCommunityEngagementStatsService.getStats(req.params.postId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Engagement stats fetched',
    data: result
  });
});

const getPostCommunityComments = catchAsync(async (req: Request, res: Response) => {
  const result = await postCommunityEngagementStatsService.getPostCommunityComments(req.params.postId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific post community comments fetched',
    data: result
  });
});

export const postCommunityEngagementStatsController = {
  like,
  unlike,
  comment,
  getStats,
  getPostCommunityComments
};
