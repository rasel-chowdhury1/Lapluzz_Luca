import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { jobService } from './job.service';
import { storeFiles } from '../../utils/fileHelper';
import httpStatus from 'http-status';

const createJob = catchAsync(async (req: Request, res: Response) => {
  const { userId, email: userEmail } = req.user;
  req.body.author = userId;
  if (!req.body.email) req.body.email = userEmail;

  if (req.files) {
    const filePaths = storeFiles(
      'jobs',
      req.files as { [fieldname: string]: Express.Multer.File[] }
    );
    if (filePaths.logo) req.body.logo = filePaths.logo[0];
    if (filePaths.cover) req.body.coverImage = filePaths.cover[0];
    if (filePaths.gallery) req.body.gallery = filePaths.gallery;
  }

  const result = await jobService.createJob(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Job created successfully',
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.updateJob(req.params.jobId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job updated successfully',
    data: result,
  });
});

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getAllJobs(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All jobs fetched successfully',
    data: result,
  });
});

const getMyJobsList = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getMyJobsList(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My jobs list fetched successfully',
    data: result,
  });
});

const getSubscriptionJobs = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await jobService.getSubscriptionJobs(userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All jobs fetched successfully',
    data: result,
  });
});

const getUnsubscriptionJobs = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await jobService.getUnsubscriptionJobs(userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All jobs fetched successfully',
    data: result,
  });
});

const getJobById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await jobService.getJobById(userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job fetched successfully',
    data: result,
  });
});

const getMyJobs = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await jobService.getMyJobs(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My jobs fetched successfully',
    data: result,
  });
});

const getSpecificJobStats = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const result = await jobService.getSpecificJobStats(jobId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specifice Job stats fetched successfully',
    data: result,
  });
});



const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.deleteJob(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job deleted successfully',
    data: result,
  });
});

// ✅ Get latest posts with total likes/comments
const getLatestJobs = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  console.log({userId})
  const limit = parseInt(req.query.limit as string) || 10;


  const posts = await jobService.getLatestJobs(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Latest jobs retrieved successfully',
    data: posts,
  });
});

export const jobController = {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  getLatestJobs,
  getSubscriptionJobs,
  getUnsubscriptionJobs,
  getMyJobsList,
  getSpecificJobStats
};
