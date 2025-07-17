import { Schema, model } from 'mongoose';
import { IBusinessEngagementStats, IBusinessEngagementStatsModel } from './businessEngaagementStats.interface';

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { _id: false }
);

const BusinessEngagementStatsSchema = new Schema<IBusinessEngagementStats>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, unique: true },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: { type: [CommentSchema], default: [] }
  },
  {
    timestamps: true
  }
);

const BusinessEngagementStats = model<IBusinessEngagementStats, IBusinessEngagementStatsModel>(
  'BusinessEngagementStats',
  BusinessEngagementStatsSchema
);

export default BusinessEngagementStats;
