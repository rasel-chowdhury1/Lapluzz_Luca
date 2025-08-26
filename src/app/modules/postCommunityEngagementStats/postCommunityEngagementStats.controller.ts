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

const addReplyOfSpecificComment = catchAsync(async (req: Request, res: Response) => {
   const { userId } = req.user; // Extracting user ID from the request user
    const { postId,commentId, text } = req.body; // Extracting postId and reply text from the body

    // Validate input data
    if (!text || text.trim().length === 0) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: 'Reply text cannot be empty',
        data: ''
      });
    }

    // Call the service to add the reply
    const result = await postCommunityEngagementStatsService.addReply(postId, commentId, userId, text);

    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: 'Post or Comment not found',
        data: ''
      });
    }

    // Successfully added the reply
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Reply added successfully', // Clear and meaningful message
      data: result,
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
  addReplyOfSpecificComment,
  getStats,
  getPostCommunityComments
};
