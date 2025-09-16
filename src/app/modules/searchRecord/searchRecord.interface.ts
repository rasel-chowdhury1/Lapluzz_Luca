import { Document, Model, Types } from 'mongoose';

export interface ISearchRecord extends Document {
  userId: Types.ObjectId;
  address: string;
  city?: string;
  town?: string;
  keyword: string;
  totalResults: number;
  type?: string;
  searchDate: Date;
}

export interface ISearchRecordModel extends Model<ISearchRecord> {}
