import { ObjectId, Model } from 'mongoose';

export interface IJobReview {
  jobId: ObjectId;
  userId: ObjectId;
  rating: number;
  comment: string;
}

export type IJobReviewModel = Model<IJobReview, Record<string, unknown>>;
