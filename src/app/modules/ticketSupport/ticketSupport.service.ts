import TicketSupport from './ticketSupport.model';
import { ITicketSupport } from './ticketSupport.interface';
import { sendEmail } from '../../utils/mailSender';
import config from '../../config';

const createTicket = async (payload: { 
  fullName: string; 
  email: string; 
  phone: string; 
  userId: string; 
  typeOfIssue: string; 
  description: string; 
}) => {
  const { userId, typeOfIssue, description, fullName, email, phone } = payload;

  try {
    // Save ticket
    const ticket = await TicketSupport.create({
      userId,
      typeOfIssue,
      description,
    });

    // ADMIN EMAIL
    const adminEmail = config.nodemailer_host_email || "pianofesta.official@gmail.com"; // put admin email in config/env file

    // Email content
    const subject = `Nuovo ticket di assistenza da ${fullName}`; // Nuovo ticket di assistenza da ${fullName}
    const html = `
      <div>
        <h2>New Support Ticket</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Issue Type:</strong> ${typeOfIssue}</p>
        <p><strong>Description:</strong><br>${description}</p>
      </div>
    `;

    // Send email to admin
    await sendEmail(adminEmail, subject, html);

    return ticket;

  } catch (error) {
    console.log("Ticket create error:", error);
    throw error;
  }
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
