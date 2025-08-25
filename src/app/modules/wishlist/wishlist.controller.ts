import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { wishListService } from './wishlist.service';

const createOrUpdateFolder = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { folderName, businessId, eventId, jobId } = req.body;

  const result = await wishListService.createOrUpdateFolder(
    userId,
    folderName,
    businessId,
    eventId,
    jobId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Folder created/updated successfully',
    data: result
  });
});


const removeServiceFromFolder = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // Get user ID from the request (assuming it's set by auth middleware)
  const { folderName, businessId, eventId, jobId } = req.body;

  // Validate that at least one of businessId, eventId, or jobId is provided
  const hasValidInput = businessId || eventId || jobId;
  if (!hasValidInput) {
    sendResponse(res, {
    statusCode: 400,
    success: false,
    message: 'You must provide at least one ID: businessId, eventId, or jobId',
    data: ""
  });
  }

    // Call the remove service function from the service layer
  const result = await wishListService.removeServiceFromFolder(
    userId,
    folderName,
    businessId ? 'businesses' : eventId ? 'events' : 'jobs', // Identify service type dynamically
    businessId || eventId || jobId // Pass the appropriate ID
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist item remove successfully',
    data: result
  });
});

const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  const result = await wishListService.getWishlistByUser(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist fetched successfully',
    data: result
  });
});

const getWishlistFolderDetailsByName = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { folderName } = req.params;

  const result = await wishListService.getWishlistFolderDetailsByName(userId, folderName);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist folder details by name fetched successfully',
    data: result
  });
});

const getWishlistWithTotals = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  const wishlist = await wishListService.getCheckWishlistByUser(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User wishlist fetched successfully with total counts',
    data: wishlist
  });
});


const updateFolderIsActive = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { folderName, isActive } = req.body;

  const wishlist = await wishListService.updateFolderIsActive(userId, folderName, isActive);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Folder "${folderName}" has been successfully ${isActive ? 'activated' : 'deactivated'}`,
    data: wishlist,
  });
});

export const wishListController = {
  createOrUpdateFolder,
  getWishlist,
  getWishlistWithTotals,
  updateFolderIsActive,
  getWishlistFolderDetailsByName,
  removeServiceFromFolder
};
