import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { pollCommunityService } from './pollCommunity.service';

const createPoll = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  req.body.creator = userId;

  const result = await pollCommunityService.createPoll(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Poll created successfully',
    data: result
  });
});

const getAllPolls = catchAsync(async (req: Request, res: Response) => {
  const result = await pollCommunityService.getAllPolls(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Polls fetched successfully',
    data: result
  });
});

const getLatestPolls = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req.user;
  const result = await pollCommunityService.getLatestPolls(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Latest polls fetched successfully',
    data: result
  });
});

const getMyLatestPolls = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req.user;
  const result = await pollCommunityService.getMyLatestPolls(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My latest polls fetched successfully',
    data: result
  });
});

const getPollById = catchAsync(async (req: Request, res: Response) => {
  const { pollId } = req.params;
  const { userId } = req.user;
  const result = await pollCommunityService.getPollById(pollId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Poll fetched successfully',
    data: result
  });
});

const vote = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { pollId, optionIndex } = req.body;

  const result = await pollCommunityService.votePollOption(pollId, optionIndex, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Voted successfully',
    data: result
  });
});

const deletePoll = catchAsync(async (req: Request, res: Response) => {
  const result = await pollCommunityService.deletePoll(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Poll deleted successfully',
    data: result
  });
});

export const pollCommunityController = {
  createPoll,
  getAllPolls,
  getPollById,
  vote,
  deletePoll,
  getLatestPolls,
  getMyLatestPolls
};
