import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { eventService } from './event.service';
import { storeFiles } from '../../utils/fileHelper';
import httpStatus from 'http-status';

const createEvent = catchAsync(async (req: Request, res: Response) => {

  const { userId, email: userEmail } = req.user;

  req.body.author = userId;

  // If email not provided in body, use the one from user
  if (!req.body.email) {
    req.body.email = userEmail;
  }
  

  if (req.files) {
    const filePaths = storeFiles(
      'events',
      req.files as { [fieldname: string]: Express.Multer.File[] }
    );

    if (filePaths.logo) req.body.logo = filePaths.logo[0];
    if (filePaths.cover) req.body.coverImage = filePaths.cover[0];
    if (filePaths.gallery) req.body.gallery = filePaths.gallery;
    if (filePaths.promotions) req.body.promotions= filePaths.promotions;
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

  // Handle file uploads
  if (req.files) {
    const filePaths = storeFiles(
      'events',
      req.files as { [fieldname: string]: Express.Multer.File[] }
    );

    if (filePaths.logo) req.body.logo = filePaths.logo[0];
    if (filePaths.cover) req.body.coverImage = filePaths.cover[0];
    if (filePaths.gallery) req.body.gallery = filePaths.gallery;
    if (filePaths.promotions) req.body.promotions = filePaths.promotions;
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


const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await eventService.deleteEvent(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Event deleted successfully',
    data: result,
  });
});

export const eventController = {
  createEvent,
  getAllEvents,
  getSubscriptionEvents,
  getUnsubscriptionEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getExtraDataEventById,
  getMyEventList,
  getSpecificEventStats,
  getAllEventList,
  activateEventById
};
