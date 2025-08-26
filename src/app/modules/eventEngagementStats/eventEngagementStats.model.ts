import { Schema, model } from 'mongoose';
import {
  IEventEngagementStats,
  IEventEngagementStatsModel
} from './eventEngagementStats.interface';

const ReplySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [ReplySchema]
  },
  { _id: true }
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
