import { Date, ObjectId, Model } from 'mongoose';
import { IFaq,  ISocialLinks } from '../business/business.interface';


export interface CompetitionResultOfEvent {
  competitionScore: number;
  suggestedPack: 'DIAMOND' | 'EMERALD' | 'RUBY';
  plusActive: boolean;
}

export interface IEventSubscription {
  type: string;
  buyDate: Date;
  expireDate: Date;
}


export interface IGallery {
  url: string;
  key: string;
}

export interface IEvent {
  author: ObjectId;
  businessId: ObjectId;
  name: string;
  description: string;
  detailDescription: string;
  logo: string;
  coverImage: string;
  gallery: IGallery[];
  phoneNumber: string;
  email: string;
  bookingAndPaymentLink: string;
  address: string;
  location: {
    type: string;
    coordinates: number[];
  };
  longitude?: string;
  latitude?: string;

  category: string;
  type: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  supportedServices: string[];
  additionalServices: string[];
  maxParticipants: number;
  entranceFee: number;
  additionalNotes: string;
  faq: IFaq[];
  promotions: IGallery[];
  subscriptionList: IEventSubscription[];
  isSubscription: boolean;
  subscriptionType: string;
  subsciptionPriorityLevel?: number;
  subscriptionStatus?: string;
  expireSubscriptionTime?: Date;
  subscriptionEndTime?: Date;
  isActive: boolean;
  isDeleted: boolean;
}

export type IEventModel = Model<IEvent, Record<string, unknown>>;
