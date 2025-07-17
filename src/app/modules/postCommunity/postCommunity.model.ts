import { Schema, model } from 'mongoose';
import { IPostCommunity, IPostCommunityModel } from './postCommunity.interface';

const PostCommunitySchema = new Schema<IPostCommunity>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    region: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' }
  },
  { timestamps: true }
);

const PostCommunity = model<IPostCommunity, IPostCommunityModel>(
  'PostCommunity',
  PostCommunitySchema
);

export default PostCommunity;
