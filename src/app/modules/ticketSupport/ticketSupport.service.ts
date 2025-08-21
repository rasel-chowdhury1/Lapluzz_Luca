import TicketSupport from './ticketSupport.model';
import { ITicketSupport } from './ticketSupport.interface';

const createTicket = async (payload: { 
  fullName: string; 
  email: string; 
  phone: string; 
  userId: string; 
  typeOfIssue: string; 
  description: string; 
}) => {
  const { userId, typeOfIssue, description, fullName, email, phone } = payload;
   // Save ticket in DB
  const ticket = await TicketSupport.create({
    userId,
    issue: typeOfIssue,
    description,
  });
  
  return ticket;
};

const getAllTickets = async () => {
  return TicketSupport.find().populate('userId', 'name email');
};

const getTicketByUser = async (userId: string) => {
  return TicketSupport.find({ userId }).sort({ createdAt: -1 });
};

export const TicketSupportService = {
  createTicket,
  getAllTickets,
  getTicketByUser,
};
