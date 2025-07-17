import { ObjectId, Model } from 'mongoose';

export interface IComment {
  user: ObjectId;
  text: string;
}

export interface IBusinessEngagementStats {
  businessId: ObjectId;
  followers: ObjectId[];
  likes: ObjectId[];
  comments: IComment[];
}

export type IBusinessEngagementStatsModel = Model<IBusinessEngagementStats, Record<string, unknown>>;
