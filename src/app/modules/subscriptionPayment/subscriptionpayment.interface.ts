import { Types, Document } from 'mongoose';

export type SubscriptionForType = 'Business' | 'Event' | 'Job';

export interface ISubscriptionPayment extends Document {
  paymentId: string;
  amount: number;
  userId: Types.ObjectId;
  subscription: Types.ObjectId;
  subscriptionFor: Types.ObjectId;
  subscriptionForType: SubscriptionForType;
  subscriptionOptionIndex?: Number;
  paymentType?: 'Card' | 'Paypal' | 'Bank' | 'Stripe' | 'Credit';
  status: string;
  expireDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
