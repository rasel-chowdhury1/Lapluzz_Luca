import { Schema, model } from 'mongoose';
import {
  IEventProfileViews,
  IEventProfileViewsModel
} from './eventProfileViews.interface';

const viewUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, required: true }
  },
  { _id: false }
);

const eventProfileViewsSchema = new Schema<IEventProfileViews>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
    viewUsers: { type: [viewUserSchema], default: [] }
  },
  { timestamps: true }
);

const EventProfileViews = model<IEventProfileViews, IEventProfileViewsModel>(
  'EventProfileViews',
  eventProfileViewsSchema
);

export default EventProfileViews;

