import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { reportService } from './report.service';
import httpStatus from 'http-status';

const createReport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { type, targetId, reason } = req.body;

  const result = await reportService.createReport({ userId, type, targetId, reason });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Report created successfully',
    data: result,
  });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.getAllReports(req.query);


  console.log("report =>> ",result)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All reports retrieved successfully',
    data: result,
  });
});

const getReportById = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.getReportById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report details retrieved successfully',
    data: result,
  });
});

// Mark report as completed
const markAsCompleted = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await reportService.markAsCompleted(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report marked as completed',
    data: result,
  });
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const result = await reportService.deleteReport(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report deleted successfully',
    data: result,
  });
});

export const reportController = {
  createReport,
  getAllReports,
  getReportById,
  markAsCompleted,
  deleteReport,
};

