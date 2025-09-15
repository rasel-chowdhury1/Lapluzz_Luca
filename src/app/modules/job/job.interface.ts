import { ObjectId, Date, Model } from 'mongoose';
import { IFaq, IGallery } from '../business/business.interface';

export interface IJobSubscription {
  type: string;
  buyDate: Date;
  expireDate: Date;
}

export interface IJob {
  author: ObjectId;
  businessId: ObjectId;
  title: string;
  description: string;
  logo: string;
  coverImage: string;
  gallery: string[];
  phoneNumber: string;
  email: string;
  categoryId: ObjectId;
  category: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  role: string;
  contractType: string; // 'fullTime', 'partTime'
  salery: number;
  experience: string;
  availability: string; // ['immediate', '15days', '1week', '1month']
  workHour: number;
  faq: IFaq[];
  subscriptionList: IJobSubscription[];
  isSubscription: boolean;
  subscriptionType: string;
  subsciptionPriorityLevel?: number;
  subscriptionStatus?: string;
  subBlueVerifiedBadge: boolean;
  expireSubscriptionTime?: Date;
  subscriptionEndTime?: Date;
  isActive: boolean;
  isDeleted: boolean;
}

export type IJobModel = Model<IJob, Record<string, unknown>>;
