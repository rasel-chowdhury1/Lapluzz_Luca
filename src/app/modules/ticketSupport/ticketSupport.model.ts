import { Schema, model } from 'mongoose';
import { ITicketSupport, ITicketSupportModel } from './ticketSupport.interface';

const TicketSupportSchema = new Schema<ITicketSupport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    typeOfIssue: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const TicketSupport = model<ITicketSupport, ITicketSupportModel>('TicketSupport', TicketSupportSchema);
export default TicketSupport;
