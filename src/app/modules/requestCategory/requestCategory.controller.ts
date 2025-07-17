import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { RequestedCategoryService } from './requestCategory.service';
import sendResponse from '../../utils/sendResponse';

// ✅ Create a new requested category
const createRequestedCategory = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  req.body.user = userId;
  console.log('"request category ->> ', req.body)
  const result = await RequestedCategoryService.createRequestedCategory(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Requested category created successfully',
    data: result,
  });
});

// ✅ Get all non-deleted requested categories
const getAllRequestedCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await RequestedCategoryService.getAllRequestedCategories(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Requested categories fetched successfully',
    data: result,
  });
});

// ✅ Get one by ID (excluding soft-deleted)
const getRequestedCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await RequestedCategoryService.getRequestedCategoryById(req.params.id);
  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Requested category not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Requested category fetched successfully',
    data: result,
  });
});

// ✅ Soft delete by ID
const deleteRequestedCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await RequestedCategoryService.deleteRequestedCategory(req.params.id);
  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: 'Requested category not found or already deleted',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Requested category soft deleted successfully',
    data: null,
  });
});


export const requestCategoryController = {
    createRequestedCategory,
    getAllRequestedCategories,
    getRequestedCategoryById,
    deleteRequestedCategory
}
