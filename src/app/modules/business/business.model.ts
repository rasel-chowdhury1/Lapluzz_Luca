import { model, Schema } from 'mongoose';
import {
  IAvailabilities,
  IBusiness,
  IBusinessAdvertisingCredits,
  IBusinessModules,
  IBusinessSubscription,
  IFaq,
  IGallery,
  ISocialLinks,
} from './business.interface';

const GallerySchema = new Schema<IGallery>({
  url: { type: String, required: true },
  key: { type: String, required: true },
});

const SocialLinksSchema = new Schema<ISocialLinks>({
  facebook: { type: String, default: null },
  instagram: { type: String, default: null },
  twitter: { type: String, default: null },
  tiktok: { type: String, default: null },
});

const FaqSchema = new Schema<IFaq>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const AvailabilitiesSchema = new Schema<IAvailabilities>({
  day: [{ type: String, required: true }],
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

const IBusinessSubscriptionSchema = new Schema<IBusinessSubscription>({
  type: {type: String, enum: ['exclusive','elite','prime'], default: null},
  buyDate: {type: Date, default: null},
  expireDate: {type: Date, default: null}
})

const BusinessAdvertisingCreditsSchema = new Schema<IBusinessAdvertisingCredits>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  credits: { type: Number, default: 0 },
  provideDate: { type: Date, default: null },
});

const businessSchema = new Schema<IBusiness>(
  {
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    detailDescription: { 
        type: String, 
        default: '' 
    },
    logo: { 
        type: String, 
        default: '' 
    },
    coverImage: { 
        type: String, 
        default: '' 
    },
    gallery: {
      type: [String],
      default: []
    },
    phoneNumber: { 
        type: String, 
        required: false 
    },
    email: { 
        type: String, 
        required: false 
    },
    website: { 
        type: String, 
        default: '' 
    },
    
    
    socialLinks: { 
        type: SocialLinksSchema, 
        default: () => ({}) 
    },

    availabilities: AvailabilitiesSchema,
    
    address: { 
        type: String, 
        default: null 
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0,0]
        // longitude, latitude order
      },
    },
    providerType: { 
        type: Schema.Types.ObjectId, 
        ref: 'Categories' 
      },
    supportedServices: {
      type: [String],
      default: []
    },
    additionalServices: {
      type: [String],
      default: []
    },
    priceRange: { 
        type: String,
        enum: ["budget", "medium", "high", "luxury"]  
    },
    maxGuest: { 
        type: Number, 
        default: 0 
    },
    faq: [FaqSchema],
    // coverColor: { 
    //     type: String, 
    //     default: null 
    // },
    promotionImage: {
      type: [String],
      default: []
    },
    businessLevel: {
      type: String,
      enum: ['main', 'sub'],
      default: 'main'
    },
    subcriptionList: {
      type: [IBusinessSubscriptionSchema],
      default: []
    },
    isSubscription: {
      type: Boolean,
      default: false
    },
    subscriptionType: {
      type: String,
      enum: ['none','exclusive','elite','prime'],
      default: 'none'
    },
    expireSubscriptionTime: { 
        type: Date, 
        default: null 
    },
    advertisingCreditsList: {
      type: [BusinessAdvertisingCreditsSchema],
      default: []
    },
    totalAdvertisingCredits: {
      type: Number,
      default: 0
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
  },
  {
    timestamps: true,
  },
);

businessSchema.index({ location: '2dsphere' });

const Business = model<IBusiness, IBusinessModules>('Business', businessSchema);
export default Business;