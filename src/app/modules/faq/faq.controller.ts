import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import faqService from './faq.service';

const getFaqs = catchAsync(async (req: Request, res: Response) => {
  const result = await faqService.getAllFaqs();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result,
  });
});

const updateFaqs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, index, faqItem } = req.body;

  const result = await faqService.updateFaqs(id, {
    type,
    index,
    faqItem,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: type === 'push' ? 'FAQ added successfully' : 'FAQ updated successfully',
    data: result,
  });
});

const createFaqs = catchAsync(async (req: Request, res: Response) => {
  const result = await faqService.createFaqs(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'FAQs created successfully',
    data: result,
  });
});


export const faqController = {
  getFaqs,
  updateFaqs,
  createFaqs
};
