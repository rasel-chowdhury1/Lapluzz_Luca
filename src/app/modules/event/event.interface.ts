import { Date, ObjectId, Model } from 'mongoose';
import { IFaq, IGallery, ISocialLinks } from '../business/business.interface';

export interface IEventSubscription {
  type: string;
  buyDate: Date;
  expireDate: Date;
}

export interface IEvent {
  author: ObjectId;
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
  expireSubscriptionTime?: Date;
  isDeleted: boolean;
}

export type IEventModel = Model<IEvent, Record<string, unknown>>;
