import { Schema, model } from 'mongoose';
import { IPollCommunity, IPollCommunityModel } from './pollCommunity.interface';

const OptionSchema = new Schema(
  {
    text: { type: String, required: true },
    votes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { _id: false }
);

const PollCommunitySchema = new Schema<IPollCommunity>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    region: { type: String, required: true },
    description: { type: String, required: true },
    options: { type: [OptionSchema], required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const PollCommunity = model<IPollCommunity, IPollCommunityModel>(
  'PollCommunity',
  PollCommunitySchema
);

export default PollCommunity;
