import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { JobApplicantService } from './jobApplicant.service';
import { storeFile } from '../../utils/fileHelper';

const addApplicant = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const { userId } = req.user;
    let applicant = {
      user: userId,
      viewCvImage: ""
  }

    if (req?.file) {
      applicant.viewCvImage = storeFile('job', req?.file?.filename);
    }


  const result = await JobApplicantService.addJobApplicant(jobId, applicant);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Applicant added successfully',
    data: result,
  });
});

const getApplicants = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const result = await JobApplicantService.getJobApplicants(jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Applicants retrieved successfully',
    data: result,
  });
});

export const JobApplicantController = {
  addApplicant,
  getApplicants
}
