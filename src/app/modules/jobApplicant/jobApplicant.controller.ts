import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { JobApplicantService } from './jobApplicant.service';
import sendResponse from '../../utils/sendResponse';
import catchAsync from '../../utils/catchAsync';
import { storeFile } from '../../utils/fileHelper';


const createJobApplicant = catchAsync(async (req: Request, res: Response) => {
  req.body.userId = req.user.userId;
  if (req?.file) {
      req.body.viewCvImage = storeFile('job', req?.file?.filename);
    }
  const result = await JobApplicantService.createJobApplicant(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Job applicant added successfully',
    data: result
  });
});

const getApplicantsByJob = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const result = await JobApplicantService.getApplicantsByJob(jobId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Applicants fetched successfully',
    data: result
  });
});

const getApplicant = catchAsync(async (req: Request, res: Response) => {
  const { jobId, userId } = req.params;
  const result = await JobApplicantService.getApplicant(jobId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Applicant fetched successfully',
    data: result
  });
});

export const JobApplicantController = {
  createJobApplicant,
  getApplicantsByJob,
  getApplicant
};
