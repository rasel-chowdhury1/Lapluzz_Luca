import { Request, Response,  } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { InspirationService } from './inspiration.service';
import sendResponse from '../../utils/sendResponse';
import { storeFiles } from '../../utils/fileHelper';
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';
import Category from '../category/category.model';

const createInspiration = catchAsync(
  async (req: Request, res: Response) => {


    req.body.author = req.user.userId;

    const categoryData = await Category.findById(req.body.category);
    if (!categoryData) {
      return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Category not found',
            data: null,
          });
        }

        if (categoryData.name === "Getting Started Ideas") {
          req.body.subCategory ="ideas"; // Set subCategory to "ideas" for "Getting Started Ideas"
        } else if (categoryData.name === "Seasonal Trends") {
          req.body.subCategory = "sessional"; // Set subCategory to "sessional" for "Seasonal Trends"
        } else if (categoryData.name === "Real Events That Inspire") {
          req.body.subCategory = "inspire"; // Set subCategory to "inspire" for "Real Events That Inspire"
        } else if (categoryData.name === "Style & Mood") {
          req.body.subCategory = "styleMood"; // Set subCategory to "styleMood" for "Style & Mood"
        }
        else{
          req.body.subCategory = "latest"; // Default to "latest" if no match found
        }


      if (req.files) {
    
      
        try {
          
          const uploadedFiles = await uploadMultipleFilesToS3(
            req.files as { [fieldName: string]: Express.Multer.File[] }
          );
    

              // cleanup local temp files after upload
          for (const fieldName in req.files) {
            const files = (req.files as { [fieldName: string]: Express.Multer.File[] })[fieldName];
            for (const file of files) {
              try {
                if (fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                }
              } catch (err) {
                console.error(`Failed to delete file ${file.path}:`, err);
              }
            }
          }
    
          if (uploadedFiles.cover?.[0]) {
            req.body.coverImage = uploadedFiles.cover[0];
          }
    
    
          if (uploadedFiles.gallery?.length) {
            req.body.imageGallery = uploadedFiles.gallery;
          }
    
    
          console.log("req body ==>>> ", req.body)
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


    const result = await InspirationService.createInspiration(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Inspiration created successfully',
      data: result,
    });
  }
);

const getAllInspirations = catchAsync(
  async (req: Request, res: Response) => {
    const result = await InspirationService.getAllInspirations(req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inspirations fetched successfully',
      data: result,
    });
  }
);

const getMyInspirations = catchAsync(
  async (req: Request, res: Response) => {
    console.log(req.user)
    const { userId } = req.user;
    const result = await InspirationService.getMyInspirations(userId,req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'My inspirations fetched successfully',
      data: result,
    });
  }
);

const getAllInspirationsgroupBySubcategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await InspirationService.getAllInspirationsgroupBySubcategory();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All inspirations grouped by sub category fetched successfully',
      data: result,
    });
  }
);

const getAllInspirationsGroupedByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await InspirationService.getAllInspirationsGroupedByCategory();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'All inspirations grouped by category fetched successfully',
      data: result,
    });
  }
);

const getSpecificCategoryInspiration = catchAsync(
  async (req: Request, res: Response) => {
    const {categoryId} = req.params;
    const result = await InspirationService.getSpecificCategoryInspiration(categoryId, req.query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inspirations fetched successfully',
      data: result,
    });
  }
);

 const getInspirationById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await InspirationService.getInspirationById(req.params.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inspiration fetched successfully',
      data: result,
    });
  }
);

 const updateInspiration = catchAsync(
   async (req: Request, res: Response) => {
     
           if (req.files) {
    
      
        try {
          
          const uploadedFiles = await uploadMultipleFilesToS3(
            req.files as { [fieldName: string]: Express.Multer.File[] }
          );
    

              // cleanup local temp files after upload
          for (const fieldName in req.files) {
            const files = (req.files as { [fieldName: string]: Express.Multer.File[] })[fieldName];
            for (const file of files) {
              try {
                if (fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                }
              } catch (err) {
                console.error(`Failed to delete file ${file.path}:`, err);
              }
            }
          }
    
          if (uploadedFiles.cover?.[0]) {
            req.body.coverImage = uploadedFiles.cover[0];
          }
    
    
          if (uploadedFiles.gallery?.length) {
            req.body.imageGallery = uploadedFiles.gallery;
          }
    
    
          console.log("req body ==>>> ", req.body)
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
    const result = await InspirationService.updateInspiration(req.params.id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inspiration updated successfully',
      data: result,
    });
  }
);

const deleteInspiration = catchAsync(
  async (req: Request, res: Response) => {
    await InspirationService.deleteInspiration(req.params.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Inspiration deleted successfully',
      data: null
    });
  }
);

export const inspirationController = {
  createInspiration,
  getMyInspirations,
  getAllInspirations,
    getAllInspirationsGroupedByCategory,
    getAllInspirationsgroupBySubcategory,
    getInspirationById,
    getSpecificCategoryInspiration,
    updateInspiration,
    deleteInspiration,
}
