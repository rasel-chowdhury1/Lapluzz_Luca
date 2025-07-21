import { Request, Response,  } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { InspirationService } from './inspiration.service';
import sendResponse from '../../utils/sendResponse';
import { storeFiles } from '../../utils/fileHelper';


const createInspiration = catchAsync(
  async (req: Request, res: Response) => {

    req.body.author = req.user.userId;
    
    if(req.files){
    try {
       // Use storeFiles to process all uploaded files
      const filePaths = storeFiles(
        'inspiration',
        req.files as { [fieldName: string]: Express.Multer.File[] },
      );

      // Set photos (multiple files)
      if (filePaths.cover && filePaths.cover.length > 0) {
        req.body.coverImage = filePaths.cover[0]; // Assign full array of photos
      }

      // Set image (single file)
      if (filePaths.gallery && filePaths.gallery.length > 0) {
        req.body.imageGallery = filePaths.gallery; // Assign first image
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
    getInspirationById,
    getSpecificCategoryInspiration,
    updateInspiration,
    deleteInspiration,
}
