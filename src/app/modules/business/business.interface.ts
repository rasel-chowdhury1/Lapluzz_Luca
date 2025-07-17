import { Date, Model, ObjectId, Types } from 'mongoose';
import { ICategory } from '../category/category.interface';

export interface IGallery {
  url: string;
  key: string;
}
export interface ISocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
}

export interface IFaq {
  question: string;
  answer: string;
}

export interface IAvailabilities {
  day: string[];
  startTime: string;
  endTime: string;
}

export interface IBusinessSubscription{
  type: string;
  buyDate: Date;
  expireDate: Date;
}

export interface IBusinessAdvertisingCredits {
  userId: Types.ObjectId;
  credits: number;
  provideDate: Date | null;
}

export interface IBusiness {
  author: ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
  website: string;
  socialLinks: ISocialLinks;
  description: string;
  detailDescription: string;
  logo: string;
  coverImage: string;
  // coverColor: string;
  promotionImage: string;
  gallery: IGallery[];
  faq: IFaq[];
  providerType: ObjectId;
  supportedServices: [string];
  additionalServices: [string];
  availabilities: IAvailabilities;
  priceRange: string;
  maxGuest: number;
  address: string;
  longitude?: string;
  latitude?: string;
  location: {
    type: string;
    coordinates: number[];
  };
  subcriptionList: IBusinessSubscription[],
  businessLevel: string;
  isSubscription: boolean;
  subscriptionType: string;
  advertisingCreditsList: IBusinessAdvertisingCredits[];
  totalAdvertisingCredits: number;
  expireSubscriptionTime?: Date;
  isDeleted: boolean;
}

export type IBusinessModules = Model<IBusiness, Record<string, unknown>>;