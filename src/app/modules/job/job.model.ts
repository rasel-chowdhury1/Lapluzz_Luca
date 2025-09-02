import { Schema, model } from 'mongoose';
import { IFaq } from '../business/business.interface';
import { IJob, IJobModel, IJobSubscription } from './job.interface';

const JobSubscriptionSchema = new Schema<IJobSubscription>({
  type: { type: String, enum: ["media", "base"], default: null },
  buyDate: { type: Date, default: null },
  expireDate: { type: Date, default: null }
});

const FaqSchema = new Schema<IFaq>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
})

const JobSchema = new Schema<IJob>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
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
      type: String
    },
    email: {
      type: String
    },
    categoryId: {
      type: String,
      ref: "Category"
    },
    category: {
      type: String,
      required: true
    },
    address: {
      type: String,
      default: null
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
    role: {
      type: String,
      required: true
    },
    contractType: {
      type: String,
      enum: ['fullTime', 'partTime'],
      required: true
    },
    salery: {
      type: Number,
      required: true
    },
    experience: {
      type: String,
      default: 'Not specified'
    },
    availability: {
      type: String,
      enum: ['immediate', '15days', '1week', '1month'],
      default: 'immediate'
    },
    workHour: {
      type: Number,
      default: 0
    },
    faq: [FaqSchema],
    subscriptionList: [JobSubscriptionSchema],
    isSubscription: {
      type: Boolean,
      default: false
    },
    subscriptionType: {
      type: String,
      enum: ['none', 'visualTop', 'visualMedia', 'visualBase', "custom"],
      default: 'none'
    },
    subsciptionPriorityLevel:{
      type: Number,
      default: 0
    },
    subscriptionStatus: {
      type: String,
      enum: ["activated", "deactivated", null],
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
    timestamps: true,
  }
);

const Job = model<IJob, IJobModel>('Job', JobSchema);
export default Job;
