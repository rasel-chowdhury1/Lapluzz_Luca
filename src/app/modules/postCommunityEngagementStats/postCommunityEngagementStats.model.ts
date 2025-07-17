import { Schema, model } from 'mongoose';
import { IPostCommunityEngagementStats, IPostCommunityEngagementStatsModel } from './postCommunityEngagementStats.interface';


const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { _id: false }
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
