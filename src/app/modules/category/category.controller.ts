import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { categoryService } from './category.service';
import sendResponse from '../../utils/sendResponse'; 
import { uploadToS3 } from '../../utils/UploadFileToS3';
import { storeFile, storeFiles } from '../../utils/fileHelper';

const createCategory = catchAsync(async (req: Request, res: Response) => {

  // if (req.file) {
  //   req.body.banner = await uploadToS3({
  //     file: req.file,
  //     fileName: `images/categories/banner/${Math.floor(100000 + Math.random() * 900000)}`,
  //   });
  // }
  //   if (req?.file) {
  //   req.body.banner = storeFile('categories', req?.file?.filename);

  // }
  
    if(req.files){
    try {
       // Use storeFiles to process all uploaded files
      const filePaths = storeFiles(
        'categories',
        req.files as { [fieldName: string]: Express.Multer.File[] },
      );

      if (filePaths.icon && filePaths.icon.length > 0) {
        req.body.icon = filePaths.icon[0];
      }

      if (filePaths.banner && filePaths.banner.length > 0) {
        req.body.banner = filePaths.banner[0]; // Assign full array of photos
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

  console.log(req.body)

  const result = await categoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: 201,
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

const getDynamicCategory = catchAsync(async (req: Request, res: Response) => {
  const {categoryName}  = req.params;

  const result = await categoryService.getDynamicCategories(categoryName, req.query);
  // console.log("result =>>> ", result)
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
  
    if(req.files){
    try {
       // Use storeFiles to process all uploaded files
      const filePaths = storeFiles(
        'categories',
        req.files as { [fieldName: string]: Express.Multer.File[] },
      );

      if (filePaths.icon && filePaths.icon.length > 0) {
        req.body.icon = filePaths.icon[0];
      }

      if (filePaths.banner && filePaths.banner.length > 0) {
        req.body.banner = filePaths.banner[0]; // Assign full array of photos
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
  getDynamicCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};