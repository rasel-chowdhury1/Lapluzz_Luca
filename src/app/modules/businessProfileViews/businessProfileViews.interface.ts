import { Document, Model, Types } from 'mongoose';

export interface IViewUser {
  user: Types.ObjectId;
  viewedAt: Date;
}

export interface IBusinessProfileViews {
  businessId: Types.ObjectId;
  viewUsers: IViewUser[];
}

export interface IBusinessProfileViewsModel extends Model<IBusinessProfileViews> {}

