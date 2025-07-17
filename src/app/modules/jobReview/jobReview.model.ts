import { Schema, model } from 'mongoose';
import { IJobReview, IJobReviewModel } from './jobReview.interface';

const JobReviewSchema = new Schema<IJobReview>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const JobReview = model<IJobReview, IJobReviewModel>('JobReview', JobReviewSchema);
export default JobReview;
