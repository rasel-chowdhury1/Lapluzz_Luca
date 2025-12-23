import { ObjectId, Model } from 'mongoose';

export interface IPostCommunity {
  creator: ObjectId;
  title: string;
  category: string;
  region: string;
  description: string;
  image: string;
  gallery?: string[] | null;
  isDeleted: boolean;
  blockedUsers?: ObjectId[] | []
}


export interface UpdatePostCommunityPayload {
  title?: string;
  category?: string;
  region?: string;
  description?: string;
  image?: string;
  gallery?: string[] | null;
  isDeleted?: boolean;
}

export type IPostCommunityModel = Model<IPostCommunity, Record<string, unknown>>;
