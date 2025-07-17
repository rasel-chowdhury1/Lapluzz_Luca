import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { TicketSupportService } from './ticketSupport.service';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // assuming req.user is populated by auth middleware
  const { typeOfIssue, description } = req.body;

  const result = await TicketSupportService.createTicket({ userId, typeOfIssue, description });
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Ticket created successfully',
    data: result,
  });
});

export const getUserTickets = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const tickets = await TicketSupportService.getTicketByUser(userId);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User tickets retrieved successfully',
    data: tickets,
  });
});

export const getAllTickets = catchAsync(async (req: Request, res: Response) => {
  const tickets = await TicketSupportService.getAllTickets();
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All tickets retrieved successfully',
    data: tickets,
  });
});
