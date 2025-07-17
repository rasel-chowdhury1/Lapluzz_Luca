import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { faqService } from './faq.service';

const upsertFaqList = catchAsync(async (req: Request, res: Response) => {
  const result = await faqService.upsertFaqList(req.body.faqs); // expects { faqs: [{question, answer}, ...] }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ list saved successfully',
    data: result,
  });
});

const getFaqList = catchAsync(async (_req: Request, res: Response) => {
  const result = await faqService.getFaqList();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQ list retrieved successfully',
    data: result,
  });
});

export const faqController = {
  upsertFaqList,
  getFaqList,
};
