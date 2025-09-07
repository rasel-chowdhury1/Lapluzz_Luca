import { Model, Types } from 'mongoose';

export type TCreditType = 'paymentSubscription' | 'discount' | 'gotCredits';

export interface IUseCredits {
  userId: Types.ObjectId;
  type: TCreditType;
  businessId?: Types.ObjectId | null;
  usedCredits: number;
  text?: string;
  image?: string;
}

export type IUseCreditsModel = Model<IUseCredits>;
