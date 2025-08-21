import { Document, Types } from 'mongoose';

export type SubscriptionForType = 'Business' | 'Event' | 'Job';

export interface ISubscriptionPayment extends Document {
  paymentId: string;
  transaction_id: string;
  userId: Types.ObjectId;
  woo_order_id: string;
  amount: number;
  amount_cents: number;
  currency: string;
  customer_name: string
  customer_email: string;
  subscriptionFor: Types.ObjectId;
  subscriptionForType: SubscriptionForType;
  subscription: Types.ObjectId;
  subscriptionOptionIndex?: Number;
  payment_method: string;
  payment_status: string;
  paymentType: string;
  status: string;
  userStatus: string;
  currentStatus: string;
  couponCode?: string;
  expireDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
