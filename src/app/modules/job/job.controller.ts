import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { jobService } from './job.service';
import { storeFiles } from '../../utils/fileHelper';
import httpStatus from 'http-status';
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

const createJob = catchAsync(async (req: Request, res: Response) => {
  const { userId, email: userEmail } = req.user;
  req.body.author = userId;
  if (!req.body.email) req.body.email = userEmail;

  if (req.files) {
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );

       // cleanup local temp files after upload
      for (const fieldName in req.files) {
        const files = (req.files as { [fieldName: string]: Express.Multer.File[] })[fieldName];
        for (const file of files) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (err) {
            console.error(`Failed to delete file ${file.path}:`, err);
          }
        }
      }


      if (uploadedFiles.logo?.[0]) {
        req.body.logo = uploadedFiles.logo[0];
      }


      if (uploadedFiles.cover?.[0]) {
        req.body.coverImage = uploadedFiles.cover[0];
      }


      if (uploadedFiles.gallery?.length) {
        req.body.gallery = uploadedFiles.gallery;
      }

    } catch (error: any) {
      console.error('Error processing files:', error.message);
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Failed to process uploaded files',
        data: null,
      });
    }
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

    if (req.files) {
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );


      if (uploadedFiles.logo?.[0]) {
        req.body.logo = uploadedFiles.logo[0];
      }


      if (uploadedFiles.cover?.[0]) {
        req.body.coverImage = uploadedFiles.cover[0];
      }


      if (uploadedFiles.gallery?.length) {
        req.body.gallery = uploadedFiles.gallery;
      }

    } catch (error: any) {
      console.error('Error processing files:', error.message);
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Failed to process uploaded files',
        data: null,
      });
    }
  }

  
  const result = await jobService.updateJob(req.params.jobId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job updated successfully',
    data: result,
  });
});

const getAllCategoryAndJobtName = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getAllCategoryAndJobName();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: '',
    data: result
  });
});


const activateJobById = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.activateJobById(req.user.userId, req.params.jobId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Job updated successfully',
    data: result,
  });
});

const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const result = await jobService.getAllJobs(userId,  req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All jobs fetched successfully',
    data: result,
  });
});

const getAllJobList = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getAllJobsList();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All jobs list fetched successfully',
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

const getCalculateCompetitionScore = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  console.log("Event updated id ->>> ", jobId)
  const result = await jobService.calculateCompetitionScoreForJob(jobId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific job calculate competition score fetched successfully',
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


const blockJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { userId } = req.user;

  const result = await jobService.blockUserForJob(jobId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User blocked successfully for this job",
    data: result,
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
  getSpecificJobStats,
  getAllJobList,
  activateJobById,
  getCalculateCompetitionScore,
  getAllCategoryAndJobtName,
  blockJob
};
