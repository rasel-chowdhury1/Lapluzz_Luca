import { Model, Types } from 'mongoose';

export type TCreditType = 'paymentSubscription' | 'discount' | 'gotCredits';

export interface IUseCredits {
  userId: Types.ObjectId;
  type: TCreditType;
  businessOwner: Types.ObjectId;
  businessId?: Types.ObjectId | null;
  usedCredits: number;
  text?: string;
  image?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export type IUseCreditsModel = Model<IUseCredits>;
