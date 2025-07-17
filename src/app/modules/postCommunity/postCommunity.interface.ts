import { ObjectId, Model } from 'mongoose';

export interface IPostCommunity {
  creator: ObjectId;
  title: string;
  category: string;
  region: string;
  description: string;
  image: string;
}

export type IPostCommunityModel = Model<IPostCommunity, Record<string, unknown>>;
