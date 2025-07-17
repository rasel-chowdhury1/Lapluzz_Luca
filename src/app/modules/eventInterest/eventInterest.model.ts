import { Schema, model } from 'mongoose';
import { IEventInterest } from './eventInterest.interface';

const eventInterestSchema = new Schema<IEventInterest>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },
    interestUsers: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        interestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const EventInterestUserList = model<IEventInterest>(
  'EventInterestUserList',
  eventInterestSchema
);
