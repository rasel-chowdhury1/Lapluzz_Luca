import { model, Schema } from 'mongoose';
import { ISubscription, ISubscriptionModel } from './subscription.interface';

const SubscriptionOptionSchema = new Schema<ISubscription['options'][0]>(
  {
    time: {
      type: String,
      enum: ['1 Month', '3 Month', '6 Month', '12 Month'],
      required: true,
    },
    price: { type: Number, required: true },
    expirationDays: { type: Number, default: null },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
  {
    title: { type: String, required: true },
    subTitle: { type: String, default: "" },
    type: {type: String, enum: ['business','event','job'], required: true},
    feature: { type: [String], default: [] },
    options: { type: [SubscriptionOptionSchema], default: [] },
    priorityLevel: { type: Number, required: true },
    blueVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Subscription = model<ISubscription, ISubscriptionModel>('Subscription', SubscriptionSchema);
export default Subscription;
