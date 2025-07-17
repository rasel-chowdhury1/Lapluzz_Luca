import { Schema, model } from 'mongoose';
import {
  IJobProfileViews,
  IJobProfileViewsModel
} from './jobProfileViews.interface';

const viewUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, required: true }
  },
  { _id: false }
);

const jobProfileViewsSchema = new Schema<IJobProfileViews>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    viewUsers: { type: [viewUserSchema], default: [] }
  },
  { timestamps: true }
);

const JobProfileViews = model<IJobProfileViews, IJobProfileViewsModel>(
  'JobProfileViews',
  jobProfileViewsSchema
);

export default JobProfileViews;

