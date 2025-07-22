import { Schema, model } from 'mongoose';
import {
  IJobApplicantDocument,
  IJobApplicantModel
} from './jobApplicant.interface';

const JobApplicantSchema = new Schema<IJobApplicantDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    applicantUsers: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        viewCvImage: { type: String, required: true },
        applicantTime: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

const JobApplicant = model<IJobApplicantDocument, IJobApplicantModel>(
  'JobApplicant',
  JobApplicantSchema
);

export default JobApplicant;
