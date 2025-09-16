import { model, Schema, Types } from 'mongoose';
import { ISearchRecord, ISearchRecordModel } from './searchRecord.interface';

const searchRecordSchema = new Schema<ISearchRecord>(
  {
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    address: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    town: {
      type: String,
      default: ""
    },
    keyword: {
      type: String,
      required: true,
    },
    totalResults: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: false,
    },
    searchDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const SearchRecord = model<ISearchRecord, ISearchRecordModel>('SearchRecord', searchRecordSchema);
export default SearchRecord;
