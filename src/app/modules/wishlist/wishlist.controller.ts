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
  updateFolderIsActive
};
