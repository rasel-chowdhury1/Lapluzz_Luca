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
  subscriptionOptionIndex?: number;
  subcriptionDays: number;
  subscriptionPriorityLevel?: number;
  subscriptionType: string;
  payment_method: string;
  payment_status: string;
  useCredits: number;
  paymentType: string;
  status: string;
  userStatus: string;
  currentStatus: string;
  couponCode?: string;
  autoRefundAmount: number;
  gotCredits: number;
  activateExpireDays: number;
  activateDate?: Date | null;
  stopDate?: Date | null;
  autoExpireDate?: Date | null;
  expireDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
