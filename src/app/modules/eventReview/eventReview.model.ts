import { Schema, model } from 'mongoose';
import { IEventReview, IEventReviewModel } from './eventReview.interface';

const EventReviewSchema = new Schema<IEventReview>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const EventReview = model<IEventReview, IEventReviewModel>('EventReview', EventReviewSchema);
export default EventReview;
