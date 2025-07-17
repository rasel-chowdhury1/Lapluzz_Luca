import { Request, Response } from 'express';
import { getAllSearchRecords } from './searchRecord.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

export const getSearchRecords = catchAsync(async (req: Request, res: Response) => {
  const result = await getAllSearchRecords(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Search records fetched successfully!',
    meta: result.meta,
    data: result.data,
  });
});
