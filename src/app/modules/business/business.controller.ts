import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { storeFiles } from '../../utils/fileHelper';
import sendResponse from '../../utils/sendResponse';
import { businessService } from './business.service';
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

const createBusiness = catchAsync(async (req: Request, res: Response) => {
  const { userId, email } = req.user;
  req.body.author = userId;
  req.body.email = email;

  console.log(req.files)

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


      if (uploadedFiles.logo?.[0]) {
        req.body.logo = uploadedFiles.logo[0];
      }


      if (uploadedFiles.cover?.[0]) {
        req.body.coverImage = uploadedFiles.cover[0];
      }


      if (uploadedFiles.gallery?.length) {
        req.body.gallery = uploadedFiles.gallery;
      }

      if (uploadedFiles.promotionImage?.length) {
        req.body.promotionImage = uploadedFiles.promotionImage;
      }

      console.log("req body ==>>> ", req.body.promotionImage)
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
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );

          // cleanup local temp files after upload


      if (uploadedFiles.logo?.[0]) {
        req.body.logo = uploadedFiles.logo[0];
      }


      if (uploadedFiles.cover?.[0]) {
        req.body.coverImage = uploadedFiles.cover[0];
      }


      if (uploadedFiles.gallery?.length) {
        req.body.gallery = uploadedFiles.gallery;
      }

      if (uploadedFiles.promotionImage?.length) {
        req.body.promotionImage = uploadedFiles.promotionImage;
      }

      console.log("req body ==>>> ", req.body.promotionImage)
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

const activateBusinessById = catchAsync(async (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { userId } = req.user;


  const updatedBusiness = await businessService.activateBusinessById(userId, businessId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Business updated successfully',
    data: updatedBusiness,
  });
});


const getAllBusinessByLocation = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  // Extract latitude and longitude from the query parameters or body
  const { latitude, longitude, ...rest } = req.query;

  // Ensure latitude and longitude are valid numbers
  if (!latitude || !longitude) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Latitude and longitude are required',
      data: ""
    });
  }

  // Call the service with the userId, query, and user location (latitude, longitude)
  const result = await businessService.getAllBusinessByLocation(userId, rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All business location fetched successfully',
    data: result,
  });
});


const getExclusiveBusinessByLocation = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  // Extract latitude and longitude from the query parameters or body
  const { latitude, longitude, ...rest } = req.query;

  // Ensure latitude and longitude are valid numbers
  if (!latitude || !longitude) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Latitude and longitude are required',
      data: ""
    });
  }

  // Call the service with the userId, query, and user location (latitude, longitude)
  const result = await businessService.getExclusiveBusinessByLocation(userId, rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All exclusive business location fetched successfully',
    data: result,
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

const getAllBusinessList = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await businessService.getBusinessList(userId);
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
  console.log("user id from controller -> ", userId)
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


const getMyBusinessNameList = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getBusinessNameList(req.user.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'my businessusiness namelist fetched successfully',
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

 

const getAllCategoryAndBusinessName = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getAllCategoryAndBusinessName();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Businesses search completed',
    data: result
  });
});

const getAllBusinessesNameList = catchAsync(async (req: Request, res: Response) => {
  const result = await businessService.getAllBusinessesNameList();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All business namelist fetched successfully.',
    data: result
  });
});

const searchBusiness = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // নিরাপদভাবে access
  const { address,city,town, ...query } = req.query; // address,city & town আলাদা করে নিলাম

  const result = await businessService.searchBusinesses(
    query as Record<string, unknown>, // টাইপ কাস্ট
    userId,
    address as string | undefined,
    city as string | undefined,
    town as string | undefined,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Businesses search completed',
    meta: result.meta,
    data: result.data,
  });
});


const wizardSearchBusiness = catchAsync(async (req: Request, res: Response) => {

  console.log("wizard query data ->>> ",req.query)
  const {
    longitude,
    latitude,
    maxDistance,  // Get maxDistance from query parameters
    address,
    city,
    town,

    ...restQuery
  } = req.query;

  // Normalize directly in restQuery
  ["categoryName", "services", "extraServices"].forEach((key) => {
    if (restQuery[key]) {
      restQuery[key] = Array.isArray(restQuery[key])
        ? restQuery[key]
        : [restQuery[key]];
    } else {
      restQuery[key] = [];
    }
  });


  const { userId } = req.user;
  // Convert longitude and latitude to numbers if they exist
  const filters = {
    ...restQuery,
    longitude: longitude ? Number(longitude) : undefined,
    latitude: latitude ? Number(latitude) : undefined,
    maxDistance: maxDistance ? Number(maxDistance) * 1000 : 50000,  // Default to 50 km if not provided
    address: address ? address : "",
    city: city ? city : "",
    town: town ? town : ""
  };


  console.log({ filters })
  const data = await businessService.wizardSearchBusinesses(userId, filters as any);

  console.log("testing data =>>> ", data)

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Businesses retrieved successfully based on wizard filters',
    data,
  });
});

const filterSearchBusinesses = catchAsync(async (req: Request, res: Response) => {
  const {
    longitude,
    latitude,
    maxGuest,
    ...restQuery
  } = req.query;

  const { userId } = req.user;
  // Convert longitude and latitude to numbers if they exist
  const filters = {
    ...restQuery,
    maxGuest: maxGuest ? Number(maxGuest) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    latitude: latitude ? Number(latitude) : undefined,
    
  };


  console.log({ filters })
  const data = await businessService.filterSearchBusinesses(userId, filters as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Businesses retrieved successfully based on  filters',
    data,
  });
});

const getAllBusinessQueryNameList = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId; // from JWT middleware
  const result = await businessService.getAllBusinessQueryNameList(userId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All business query name list fetched sucessfully',
    data: result
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
  filterSearchBusinesses,
  getSpecificBusinessStats,
  getMyBusinessList,
  getCalculateCompetitionScore,
  getMyParentBusiness,
  activateBusinessById,
  getAllBusinessList,
  getAllBusinessQueryNameList,
  getMyBusinessNameList,
  getAllBusinessByLocation,
  getAllCategoryAndBusinessName,
  getAllBusinessesNameList,
  getExclusiveBusinessByLocation
};