import { Schema, model } from 'mongoose';
import {
  IEventEngagementStats,
  IEventEngagementStatsModel
} from './eventEngagementStats.interface';

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { _id: false }
);

const EventEngagementStatsSchema = new Schema<IEventEngagementStats>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: {
      type: [CommentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const EventEngagementStats = model<IEventEngagementStats, IEventEngagementStatsModel>(
  'EventEngagementStats',
  EventEngagementStatsSchema
);

export default EventEngagementStats;
