import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { categoryService } from './category.service';
import sendResponse from '../../utils/sendResponse'; 
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';
import httpStatus from 'http-status';
const createCategory = catchAsync(async (req: Request, res: Response) => {
  
   if (req.files) {
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );




      if (uploadedFiles.icon?.[0]) {
        req.body.icon = uploadedFiles.icon[0];
      }


      if (uploadedFiles.banner?.[0]) {
        req.body.banner = uploadedFiles.banner[0];
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

  const result = await categoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All categories fetched successfully',
    data: result,
  });
});

const getBusinessCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getBusinessCategories(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All categories fetched successfully',
    data: result,
  });
});

const getDynamicCategory = catchAsync(async (req: Request, res: Response) => {
  const {categoryName}  = req.params;

  const result = await categoryService.getDynamicCategories(categoryName, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${categoryName} categories fetched successfully`,
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategoryById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category fetched successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => { 

    if (req.files) {
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );



      if (uploadedFiles.icon?.[0]) {
        req.body.icon = uploadedFiles.icon[0];
      }


      if (uploadedFiles.banner?.[0]) {
        req.body.banner = uploadedFiles.banner[0];
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

  const result = await categoryService.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getAllCategory,
  getBusinessCategories,
  getDynamicCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};