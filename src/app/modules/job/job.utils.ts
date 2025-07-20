import { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import Job from "./job.model";
import sendResponse from "../../utils/sendResponse";

export const verifyJobOwnership = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { JobId } = req.params;
    const userId = req.user?.userId; // Ensure this is coming from your JWT payload

    // Check if the Job exists
    const isExistJob = await Job.findById(JobId)
    if (!isExistJob) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Job not found.",
        data: null,
      });
    }

    // Check if the authenticated user is the owner
    if (String(isExistJob.author) !== String(userId)) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
    }

    // All good, proceed to the next middleware
    next();
  });
};