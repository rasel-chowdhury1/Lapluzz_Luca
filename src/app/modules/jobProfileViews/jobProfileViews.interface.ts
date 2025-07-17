import { Model, Types } from 'mongoose';

export interface IJobProfileViewUser {
  user: Types.ObjectId;
  viewedAt: Date;
}

export interface IJobProfileViews {
  jobId: Types.ObjectId;
  viewUsers: IJobProfileViewUser[];
}

export interface IJobProfileViewsModel extends Model<IJobProfileViews> {}
