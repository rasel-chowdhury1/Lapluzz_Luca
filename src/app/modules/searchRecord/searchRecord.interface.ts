import { Document, Model, Types } from 'mongoose';

export interface ISearchRecord extends Document {
  userId: Types.ObjectId;
  keyword: string;
  totalResults: number;
  searchDate: Date;
}

export interface ISearchRecordModel extends Model<ISearchRecord> {}
