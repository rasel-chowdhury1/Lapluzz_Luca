import { Model, Types } from 'mongoose';

export interface IEventProfileViewUser {
  user: Types.ObjectId;
  viewedAt: Date;
}

export interface IEventProfileViews {
  eventId: Types.ObjectId;
  viewUsers: IEventProfileViewUser[];
}

export interface IEventProfileViewsModel extends Model<IEventProfileViews> {}
