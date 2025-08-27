import { Schema, model } from 'mongoose';

import { IGallery, IFaq } from '../business/business.interface';
import { IEvent, IEventModel, IEventSubscription } from './event.interface';

const GallerySchema = new Schema<IGallery>({
  url: { type: String, required: true },
  key: { type: String, required: true },
});

const FaqSchema = new Schema<IFaq>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const EventSubscriptionSchema = new Schema<IEventSubscription>({
  type: { type: String, default: null },
  buyDate: { type: Date, default: null },
  expireDate: { type: Date, default: null }
});

const EventSchema = new Schema<IEvent>(
  {
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
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
        default: ''
    },
    email: { 
        type: String,
        default: ''
     },
    bookingAndPaymentLink: { 
        type: String, 
        default: '' 
    },
    address: { 
        type: String, 
        default: ''
     },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    category: { type: String, required: true },
    type: { 
        type: String, 
        required: true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    startTime: { 
        type: String, 
        required: true 
    },
    endTime: { 
        type: String, 
        required: true 
    },
    supportedServices: { 
        type: [String], 
        default: [] 
    },
    additionalServices: { 
        type: [String], 
        default: [] 
    },
    maxParticipants: { 
        type: Number, 
        default: 0 
    },
    entranceFee: { 
        type: Number, 
        default: 0 
    },
    additionalNotes: { 
        type: String, 
        default: '' 
    },
    faq: [FaqSchema],
    promotions: {
            type: [String],
            default: []
    },
    subscriptionList: [EventSubscriptionSchema],
    isSubscription: { 
        type: Boolean, 
        default: false },
    subscriptionType: {
      type: String,
      enum: ['none','diamond','emerald','ruby', "custom"],
      default: 'none'
    },
    subsciptionPriorityLevel:{
      type: Number,
      default: 0
    },
    subcriptionStatus: {
      type: String,
      enum: ["activated", "deactivated", null],
      default: null
    },
    subscriptionEndTime: { 
        type: Date, 
        default: null 
    },
    expireSubscriptionTime: { 
        type: Date, 
        default: null 
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
    timestamps: true 
}
);

const Event = model<IEvent, IEventModel>('Event', EventSchema);
export default Event;
