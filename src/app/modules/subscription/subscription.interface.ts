import { Document, Model } from "mongoose";

export type SubscriptionType = 'business' | 'event' | 'job';

export type SubscriptionTime = '1 Month' | '3 Month' | '6 Month' | '12 Month';

export interface ISubscriptionOption {
  time: SubscriptionTime;
  price: number;
  expirationDays?: number;
}

export interface ISubscription extends Document {
  title: string;
  subTitle: string;
  type: SubscriptionType;
  feature: string[];
  options: ISubscriptionOption[];
  priorityLevel: number;
  blueVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISubscriptionModel extends Model<ISubscription> {}
