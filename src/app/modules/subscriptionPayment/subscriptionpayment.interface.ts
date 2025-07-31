import { Document, Types } from 'mongoose';

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



export interface updateISubscriptionPayment extends Document {
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
  status: string;
  currentStatus: string;
  promotionCode?: string;
  expireDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
