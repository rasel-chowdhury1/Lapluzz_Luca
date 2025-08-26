import { ObjectId, Model } from 'mongoose';

export interface IReply {
  user: ObjectId; // Reference to the user who made the reply
  text: string; // The reply text
  createdAt: Date; // Date the reply was created
}

export interface IComment {
  user: ObjectId; // Reference to the user who made the comment
  text: string; // The comment text
  createdAt: Date; // Date the comment was created
  replies: IReply[]; // Array of replies to the comment
}

export interface IBusinessEngagementStats {
  businessId: ObjectId;
  followers: ObjectId[];
  likes: ObjectId[];
  comments: IComment[];
}

export type IBusinessEngagementStatsModel = Model<IBusinessEngagementStats, Record<string, unknown>>;
