import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventService } from './event.service';
import { storeFiles } from '../../utils/fileHelper';
import httpStatus from 'http-status';
import { uploadMultipleFilesToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

const createEvent = catchAsync(async (req: Request, res: Response) => {

  const { userId, email: userEmail } = req.user;

  req.body.author = userId;

  // If email not provided in body, use the one from user
  if (!req.body.email) {
    req.body.email = userEmail;
  }
  
  if (req.files) {

  
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );



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
        
        req.body.promotions = uploadedFiles.promotionImage;
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

  const result = await eventService.createEvent(req.body);


  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Event created successfully',
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  if (req.files) {
    try {
      
      const uploadedFiles = await uploadMultipleFilesToS3(
        req.files as { [fieldName: string]: Express.Multer.File[] }
      );



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
        req.body.promotions = uploadedFiles.promotionImage;
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

  // Call update service
  const result = await eventService.updateEvent(eventId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

const activateEventById = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  // Call update service
  const result = await eventService.activateEventById(userId, eventId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.getAllEvents(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All events fetched successfully',
    data: result,
  });
});

const getAllEventList = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.getEventList();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event list fetched successfully',
    data: result,
  });
});

const getSubscriptionEvents = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;

  console.log(req.user)
  const result = await eventService.getSubscrptionEvent(userId, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscription events fetched successfully',
    data: result,
  });
});

const getEventsByLocation = catchAsync(async (req: Request, res: Response) => {
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
  const result = await eventService.getEventsByLocation(userId,rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All  events fetched successfully',
    data: result,
  });
});


const getEventsByLocationGuest = catchAsync(async (req: Request, res: Response) => {
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
  const result = await eventService.getEventsByLocationGuest(rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All  events fetched successfully',
    data: result,
  });
});

const getSubscrptionEventByLocation = catchAsync(async (req: Request, res: Response) => {
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
  const result = await eventService.getSubscrptionEventByLocation(userId,rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All subscription events fetched successfully',
    data: result,
  });
});


const getUnsubscriptionEventsByLocation = catchAsync(async (req: Request, res: Response) => {
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
  const result = await eventService.getUnsubscriptionEventByLocation(userId,rest, {
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All unsubscription events fetched successfully',
    data: result,
  });
});

const getUnsubscriptionEvents = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;
  const result = await eventService.getUnsubscriptionEvent(userId,req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All unsubscription events fetched successfully',
    data: result,
  });
});

const getSearchEvents = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;
  console.log("req query data ->>>> ", req.query)
  const result = await eventService.searchEvents(req.query, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All events fetched successfully',
    data: result,
  });
});

const getSearchEventsByLocation = catchAsync(async (req: Request, res: Response) => {
   

  const {userId} = req.user;
    // Extract latitude and longitude from the query parameters or body
  const { latitude, longitude,maxDistance, ...rest } = req.query;

  // Ensure latitude and longitude are valid numbers
  if (!latitude || !longitude) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Latitude and longitude are required',
      data: ""
    });
  }
  console.log("req query data ->>>> ", req.query)
  const result = await eventService.searchEventsByLocation(userId,{
    latitude: parseFloat(latitude as string),
    longitude: parseFloat(longitude as string),
  }, maxDistance ? Number(maxDistance) * 1000 : 50000, req.query);


  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All events fetched successfully',
    data: result,
  });
});

const getMyEvents = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req.user;
  
  console.log({userId})
  const result = await eventService.getMyEvents(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My event fetched successfully',
    data: result,
  });
});

const getMyEventList = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req.user;
  
  const result = await eventService.getMyEventList(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My event list fetched successfully',
    data: result,
  });
});

const getSpecificEventStats = catchAsync(async (req: Request, res: Response) => {
  const {eventId} = req.params;
  const result = await eventService.getSpecificEventStats(eventId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific event stats fetched successfully',
    data: result,
  });
});


const getEventById = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;
  const result = await eventService.getEventById(userId,req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event fetched successfully',
    data: result,
  });
});
const getExtraDataEventById = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;
  const result = await eventService.getExtraEventDataById(req.params.id, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Extra data fetched successfully',
    data: result,
  });
});


const getCalculateCompetitionScore = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  console.log("Event updated id ->>> ", eventId)
  const result = await eventService.calculateCompetitionScoreForEvent(eventId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Specific event calculate competition score fetched successfully',
    data: result,
  });
});

const getAllCategoryAndEventName = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.getAllCategoryAndEventName();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Events search completed',
    data: result
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.deleteEvent(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

const blockEvent = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  const result = await eventService.blockEvent(eventId, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User blocked successfully for this event",
    data: result,
  });
});



export const eventController = {
  createEvent,
  getAllEvents,
  getSearchEvents,
  getSubscriptionEvents,
  getUnsubscriptionEvents,
  getUnsubscriptionEventsByLocation,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getExtraDataEventById,
  getMyEventList,
  getSpecificEventStats,
  getAllEventList,
  activateEventById,
  getCalculateCompetitionScore,
  getAllCategoryAndEventName,
  getEventsByLocation,
  getSubscrptionEventByLocation,
  getSearchEventsByLocation,
  getEventsByLocationGuest,
  blockEvent
};
