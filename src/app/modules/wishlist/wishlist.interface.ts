import { ObjectId, Model } from 'mongoose';

export interface IFolder {
  folderName: string;
  businesses: ObjectId[];
  events: ObjectId[];
  jobs: ObjectId[];
}

export interface IWishList {
  userId: ObjectId;
  folders: IFolder[];
}

export type IWishListModel = Model<IWishList, Record<string, unknown>>;
