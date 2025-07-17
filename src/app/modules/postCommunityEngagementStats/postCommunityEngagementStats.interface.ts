import { ObjectId, Model } from 'mongoose';

export interface IPostCommunityComment {
  user: ObjectId;
  text: string;
}

export interface IPostCommunityEngagementStats {
  postId: ObjectId;
  likes: ObjectId[];
  comments: IPostCommunityComment[];
}

export type IPostCommunityEngagementStatsModel = Model<IPostCommunityEngagementStats>;
