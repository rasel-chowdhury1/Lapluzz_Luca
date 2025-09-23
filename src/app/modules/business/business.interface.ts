import { Date, Model, ObjectId, Types } from 'mongoose';

export interface WizardFilters {
  categoryName?: string[];
  longitude?: number;
  latitude?: number;
  maxGuest?: string;
  services?: string[];
  extraServices?: string[];
  priceRange?: 'budget' | 'medium' | 'high' | 'luxury';
  maxDistance: number;
  address?: string,
  city?: string,
  town?: string
  
}

export interface CompetitionResult {
  competitionScore: number;
  suggestedPack: 'PRIME' | 'ELITE' | 'EXCLUSIVE';
  plusActive: boolean;
}

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
  promotionImage: IGallery[];
  gallery: IGallery[];
  faq: IFaq[];
  providerType: ObjectId;
  microCatogory: string;
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
  subBlueVerifiedBadge: boolean;
  subsciptionPriorityLevel?: number;
  subscriptionStatus?: string;
  advertisingCreditsList: IBusinessAdvertisingCredits[];
  totalAdvertisingCredits: number;
  expireSubscriptionTime?: Date;
  subscriptionEndTime?: Date;
  isActive: boolean;
  isDeleted: boolean;
  deleteGallery?: []
}

export type IBusinessModules = Model<IBusiness, Record<string, unknown>>;