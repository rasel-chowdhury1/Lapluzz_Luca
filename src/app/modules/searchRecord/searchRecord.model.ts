import { model, Schema, Types } from 'mongoose';
import { ISearchRecord, ISearchRecordModel } from './searchRecord.interface';

const searchRecordSchema = new Schema<ISearchRecord>(
  {
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    keyword: {
      type: String,
      required: true,
    },
    totalResults: {
      type: Number,
      required: true,
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
