import { ObjectId, Model } from 'mongoose';

export interface IBusinessReview {
  businessId: ObjectId;
  userId: ObjectId;
  rating: number;
  comment: string;
}

export type IBusinessReviewModel = Model<IBusinessReview, Record<string, unknown>>;
