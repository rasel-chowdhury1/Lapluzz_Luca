import { Schema, model } from 'mongoose';
import { IBusinessReview, IBusinessReviewModel } from './businessReivew.interface';

const BusinessReviewSchema = new Schema<IBusinessReview>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
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

const BusinessReview = model<IBusinessReview, IBusinessReviewModel>('BusinessReview', BusinessReviewSchema);
export default BusinessReview;
