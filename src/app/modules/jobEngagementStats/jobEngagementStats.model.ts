import { Schema, model } from 'mongoose';
import {
  IJobEngagementStats,
  IJobEngagementStatsModel
} from './jobEngagementStats.interface';

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }, // Track comment time
  },
  { _id: false }
);

const JobEngagementStatsSchema = new Schema<IJobEngagementStats>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
    comments: {
      type: [CommentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const JobEngagementStats = model<IJobEngagementStats, IJobEngagementStatsModel>(
  'JobEngagementStats',
  JobEngagementStatsSchema
);

export default JobEngagementStats;
