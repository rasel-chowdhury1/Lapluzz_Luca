import { Document, Model, Types } from 'mongoose';

export interface IJobApplicant {
  jobId: Types.ObjectId;
  userId: Types.ObjectId;
  viewCvImage: string;
}

export interface IJobApplicantDocument extends IJobApplicant, Document {}

export interface IJobApplicantModel extends Model<IJobApplicantDocument> {}
