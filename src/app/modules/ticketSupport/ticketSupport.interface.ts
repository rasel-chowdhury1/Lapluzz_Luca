import { Document, Model, Types } from 'mongoose';

export interface ITicketSupport {
  userId: Types.ObjectId;
  typeOfIssue: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicketSupportModel extends Model<ITicketSupport> {}
