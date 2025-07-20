import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import Business from "./business.model";

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const verifyBusinessOwnership = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { businessId } = req.params;
    const userId = req.user?.userId; // Ensure this is coming from your JWT payload

    // Check if the business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Business not found.",
        data: null,
      });
    }

    // Check if the authenticated user is the owner
    if (String(business.author) !== String(userId)) {
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
