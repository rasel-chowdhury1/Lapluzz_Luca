import { Schema, model } from 'mongoose';
import {
  IJobApplicantDocument,
  IJobApplicantModel
} from './jobApplicant.interface';

const JobApplicantSchema = new Schema<IJobApplicantDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewCvImage: { type: String, required: true }
  },
  { timestamps: true }
);

const JobApplicant = model<IJobApplicantDocument, IJobApplicantModel>(
  'JobApplicant',
  JobApplicantSchema
);

export default JobApplicant;
