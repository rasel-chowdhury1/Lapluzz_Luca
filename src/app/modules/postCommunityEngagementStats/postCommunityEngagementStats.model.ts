import { Schema, model } from 'mongoose';
import { IPostCommunityEngagementStats, IPostCommunityEngagementStatsModel } from './postCommunityEngagementStats.interface';

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
    replies: [ReplySchema]  // Add replies as an array of ReplySchema
  },
  { _id: true }
);

const PostCommunityEngagementStatsSchema = new Schema<IPostCommunityEngagementStats>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'PostCommunity',
      required: true,
      unique: true
    },
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

const PostCommunityEngagementStats = model<
  IPostCommunityEngagementStats,
  IPostCommunityEngagementStatsModel
>('PostCommunityEngagementStats', PostCommunityEngagementStatsSchema);

export default PostCommunityEngagementStats;
