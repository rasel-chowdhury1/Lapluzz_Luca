import { ObjectId, Model } from 'mongoose';

export interface IPollOption {
  text: string;
  votes: ObjectId[];
}

export interface IPollCommunity {
  creator: ObjectId;
  title: string;
  category: string;
  region: string;
  description: string;
  options: IPollOption[];
  isDeleted: boolean;
}

export type IPollCommunityModel = Model<IPollCommunity, Record<string, unknown>>;
