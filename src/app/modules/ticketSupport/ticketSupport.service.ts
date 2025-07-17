import TicketSupport from './ticketSupport.model';
import { ITicketSupport } from './ticketSupport.interface';

const createTicket = async (payload: ITicketSupport) => {
  const ticket = await TicketSupport.create(payload);
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
