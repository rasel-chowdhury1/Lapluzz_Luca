import { ObjectId, Model } from 'mongoose';

export interface IComment {
  user: ObjectId;
  text: string;
}

export interface IJobEngagementStats {
  jobId: ObjectId;
  comments: IComment[];
}

export type IJobEngagementStatsModel = Model<IJobEngagementStats, Record<string, unknown>>;
