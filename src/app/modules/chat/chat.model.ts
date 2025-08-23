import { Schema, model } from 'mongoose';
import { IChat } from './chat.interface';



const ChatSchema = new Schema<IChat>(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    unreadCounts: {
      type: Number,
      default: 0,
    },
    blockedUsers:  {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: null, // Set default to null
    },
    contextType: { // Optional field for business, event, or job
      type: String,
      enum: ['business', 'event', 'job', null],
      default: null,
    },
    contextId: { // ID for the specific context (businessId, eventId, jobId)
      type: Schema.Types.ObjectId,
      default: null,
    },
    status: { // Chat status (open, closed)
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

const Chat = model<IChat>('Chat', ChatSchema);

export default Chat;
