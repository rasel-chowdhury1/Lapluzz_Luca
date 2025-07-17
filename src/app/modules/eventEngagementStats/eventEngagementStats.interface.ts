import { ObjectId, Model } from 'mongoose';

export interface IComment {
  user: ObjectId;
  text: string;
}

export interface IEventEngagementStats {
  eventId: ObjectId;
  likes: ObjectId[];
  comments: IComment[];
}

export type IEventEngagementStatsModel = Model<IEventEngagementStats, Record<string, unknown>>;
