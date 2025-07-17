import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { addRequestsService } from './addRequest.service';

const createAddRequests = catchAsync(async (req: Request, res: Response) => {
  req.body['user'] = req.user.userId;
  const result = await addRequestsService.createAddRequests(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'AddRequests created successfully',
    data: result,
  });
});

const getAllAddRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.getAllAddRequests(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All addRequests fetched successfully',
    data: result,
  });
});

const getMyAddRequests = catchAsync(async (req: Request, res: Response) => {
  req.query['user'] = req.user.userId;
  const result = await addRequestsService.getAllAddRequests(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All addRequests fetched successfully',
    data: result,
  });
});

const getAddRequestsById = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.getAddRequestsById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AddRequests fetched successfully',
    data: result,
  });
});

const updateAddRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.updateAddRequests(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AddRequests updated successfully',
    data: result,
  });
});

const rejectAddRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.rejectAddRequests(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AddRequests rejected successfully',
    data: result,
  });
});

const approvedAddRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.approvedAddRequests(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AddRequests approved successfully',
    data: result,
  });
});

const deleteAddRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await addRequestsService.deleteAddRequests(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AddRequests deleted successfully',
    data: result,
  });
});

export const addRequestsController = {
  createAddRequests,
  getAllAddRequests,
  getAddRequestsById,
  updateAddRequests,
  deleteAddRequests,
  getMyAddRequests,
  rejectAddRequests,
  approvedAddRequests,
};