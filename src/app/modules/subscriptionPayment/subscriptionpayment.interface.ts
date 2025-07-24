import { Types, Document } from 'mongoose';

export type SubscriptionForType = 'Business' | 'Event' | 'Job';

export interface ISubscriptionPayment extends Document {
  paymentId: string;
  woo_order_id: string;
  amount: number;
  userId: Types.ObjectId;
  billing_email: string;
  billing_first_name: string;
  billing_last_name: string;
  subscription: Types.ObjectId;
  subscriptionFor: Types.ObjectId;
  subscriptionForType: SubscriptionForType;
  subscriptionOptionIndex?: Number;
  payment_method?: 'Card' | 'Paypal' | 'Bank' | 'Stripe' | 'Credit';
  status: string;
  expireDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
