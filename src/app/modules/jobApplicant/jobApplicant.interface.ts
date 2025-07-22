import { Document, Model, Types } from 'mongoose';

export interface IApplicantUser {
  user: Types.ObjectId;
  viewCvImage: string;
  applicantTime?: Date;
}

export interface IJobApplicant {
  jobId: Types.ObjectId;
  applicantUsers: IApplicantUser[];
}

export interface IJobApplicantDocument extends IJobApplicant, Document {}

export interface IJobApplicantModel extends Model<IJobApplicantDocument> {}
