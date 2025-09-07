import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { UseCreditsService } from './useCredits.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { uploadFileToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

const createUseCredits = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // from auth middleware
  let { type, businessId, usedCredits, text } = req.body;

  // Convert usedCredits to number
  usedCredits = Number(usedCredits);
  if (isNaN(usedCredits) || usedCredits <= 0) {
    throw new Error('usedCredits must be a positive number');
  }

  
  let image = ''; // default value

  if (req.file) {
    try {
      const data = await uploadFileToS3(req.file);
      image = data.Location || ''; // store S3 URL
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // always clean up temp file
      }
    }
  }

  const result = await UseCreditsService.createUseCredits({
    userId,
    type,
    businessId,
    usedCredits,
    text: "",
    image,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Use credits record created successfully',
    data: result,
  });
});

const getUserUseCredits = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  const credits = await UseCreditsService.getUseCreditsByUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User use credits retrieved successfully',
    data: credits,
  });
});

const getAllUseCredits = catchAsync(async (req: Request, res: Response) => {
  const credits = await UseCreditsService.getAllUseCredits();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All use credits retrieved successfully',
    data: credits,
  });
});

export const useCreditsController = {
    createUseCredits,
    getUserUseCredits,
    getAllUseCredits
}
