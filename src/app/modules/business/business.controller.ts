import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { storeFiles } from '../../utils/fileHelper';
import sendResponse from '../../utils/sendResponse';
import { businessService } from './business.service';


const createBusiness = catchAsync(async (req: Request, res: Response) => {
  const { userId, email } = req.user;
  req.body.author = userId;
  req.body.email = email;

  console.log(req.files)

  if (req.files) {
    try {
      // Use storeFiles to process all uploaded files
      const filePaths = storeFiles(
        'business',
        req.files as { [fieldName: string]: Express.Multer.File[] },
      );

      if (filePaths.logo && filePaths.logo.length > 0) {
        req.body.logo = filePaths.logo[0];
      }

      // Set photos (multiple files)
      if (filePaths.cover && filePaths.cover.length > 0) {
        req.body.coverImage = filePaths.cover[0]; // Assign full array of photos
      }

      // Set image (single file)
      if (filePaths.gallery && filePaths.gallery.length > 0) {
        req.body.gallery = filePaths.gallery; // Assign first image
      }

      if (filePaths.promotionImage && filePaths.promotionImage.length > 0) {
        req.body.promotionImage = filePaths.promotionImage;
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

  console.log("create business ->>> ", req.body)
  const result = await businessService.createBusiness(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Business created successfully',
    data: result,
  });
});

const updateBusiness = catchAsync(async (req: Request, res: Response) => {
  const { businessId } = req.params;

  if (req.files) {
    try {
      const filePaths = storeFiles(
        'business',
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );


      if (filePaths.logo && filePaths.logo.length > 0) {
        req.body.logo = filePaths.logo[0];
      }

      if (filePaths.cover && filePaths.cover.length > 0) {
        req.body.coverImage = filePaths.cover[0];
      }

      if (filePaths.gallery && filePaths.gallery.length > 0) {
        req.body.gallery = filePaths.gallery;
      }

      if (filePaths.promotionImage && filePaths.promotionImage.length > 0) {
        console.log("file paths promotion image ->>> ",filePaths.promotionImage)
        req.body.promotionImage = filePaths.promotionImage;
      }

      console.log("req body ==>>> ",req.body.promotionImage)
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

  console.log("update business =>>> ", businessId, req.body)

  const updatedBusiness = await businessService.updateBusiness(businessId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business updated successfully',
    data: updatedBusiness,
  });
});

const getAllBusiness = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await businessService.getAllBusiness(userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All business fetched successfully',
    data: result,
  });
});

const getSpecificCategoryBusiness = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { categoryId } = req.params;
  const result = await businessService.getSpecificCategoryBusiness(categoryId, userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All specific category business fetched successfully',
    data: result,
  });
});

const getSubscrptionBusiness = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getSubscrptionBusiness(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscription business fetched successfully',
    data: result,
  });
});

const getUnsubscriptionBusiness = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getUnsubscriptionBusiness(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All unsubscription business fetched successfully',
    data: result,
  });
});

const getBusinessAndEventsForMap = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getBusinessAndEventsForMap();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All business and event location fetched successfully',
    data: result,
  });
});

const getMyBusiness = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getMyBusinesses(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'my businessusiness fetched successfully',
    data: result,
  });
});

const getMyParentBusiness = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getMyParentBusiness(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'my parent business fetched successfully',
    data: result,
  });
});

const getMyBusinessList = catchAsync(async (req: Request, res: Response) => {

  const result = await businessService.getMyBusinessesList(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My businessusiness list fetched successfully',
    data: result,
  });
});

const getSpecificBusinessStats = catchAsync(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const result = await businessService.getSpecificBusinessStats(businessId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific business stats fetched successfully',
    data: result,
  });
});

const getCalculateCompetitionScore = catchAsync(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  console.log("business updated id ->>> ", businessId)
  const result = await businessService.calculateCompetitionScore(businessId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific business calculate competition score fetched successfully',
    data: result,
  });
});

const getBusinessById = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getBusinessById(req.user.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business fetched successfully',
    data: result,
  });
});

const getExtraBusinessDataById = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getExtraBusinessDataById(req.user.userId, req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Extra business fetched successfully',
    data: result,
  });
});

// const updateBusiness = catchAsync(async (req: Request, res: Response) => {
//   const result = await businessService.updateBusiness(req.params.id, req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: 'Business updated successfully',
//     data: result,
//   });
// });

const deleteBusiness = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.deleteBusiness(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Business deleted successfully',
    data: result,
  });
});


const searchBusiness = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; // from JWT middleware
  const result = await businessService.searchBusinesses(req.query, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Businesses search completed',
    meta: result.meta,
    data: result.data,
  });
});


const wizardSearchBusiness = catchAsync(async (req: Request, res: Response) => {
     const {
      longitude,
      latitude,
      ...restQuery
    } = req.query;

  const { userId } = req.user;
    // Convert longitude and latitude to numbers if they exist
    const filters = {
      ...restQuery,
      longitude: longitude ? Number(longitude) : undefined,
      latitude: latitude ? Number(latitude) : undefined,
    };

  
  console.log({filters})
    const data = await businessService.wizardSearchBusinesses(userId, filters);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Businesses retrieved successfully based on wizard filters',
      data,
    });
});

export const businessController = {
  createBusiness,
  getAllBusiness,
  getSpecificCategoryBusiness,
  getSubscrptionBusiness,
  getUnsubscriptionBusiness,
  getBusinessById,
  deleteBusiness,
  getBusinessAndEventsForMap,
  getMyBusiness,
  updateBusiness,
  getExtraBusinessDataById,
  searchBusiness,
  wizardSearchBusiness,
  getSpecificBusinessStats,
  getMyBusinessList,
  getCalculateCompetitionScore,
  getMyParentBusiness
};