import { ObjectId, Model } from 'mongoose';

export interface IEventReview {
  eventId: ObjectId;
  userId: ObjectId;
  rating: number;
  comment: string;
}

export type IEventReviewModel = Model<IEventReview, Record<string, unknown>>;
