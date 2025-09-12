import mongoose, { Schema } from "mongoose";
import { IMySubscription } from "./mySubscription.interface";


const mySubscriptionSchema = new Schema<IMySubscription>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPayment',
        unique: true
    },
    // 👇 Dynamic reference field
    subscriptionFor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'subscriptionForType',
    },
    subscriptionForType: {
        type: String,
        required: true,
        enum: ['Business', 'Event', 'Job'], // names of the models
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true,
    },
    subscriptionOptionIndex: {
        type: Number,
        required: true
    },
    subcriptionDays: {
        type: Number,
        required: true
    },
    subscriptionPriorityLevel: { 
        type: Number, 
        required: true 
    },
    subscriptionType: { 
        type: String, 
        enum: ['none','exclusive','elite','prime', 'diamond', 'emerald', 'ruby','visualTop', 'visualMedia', 'visualBase', 'custom'],
        required: true 
    },
    payment_method: {
        type: String,
        default: '',
    },
    payment_status: {
        type: String,
        default: '',
    },
    useCredits: {
      type: Number,
      default: 0
    },
    paymentType: {
      type: String,
      enum: ["credit","payment", "creditWithPayment"],
    },
    status: {
        type: String,
        enum: ["notActivate", "activate", "stop", "gotCredits", ],
        default: "notActivate"
    },
    autoRefundAmount: {
      type: Number,
      default: 0
    },
    gotCredits: {
        type: Number,
        default: 0
    },
    activateExpireDays: {
        type: Number,
        default: 0
    },
    activateExpireDate: {
        type: Date,
        default: null
    },
    activateDate: {
      type: Date,
      default: null
    },
    stopDate: {
      type: Date,
      default: null
    },
    autoExpireDate: {
      type: Date,
      default: null
    },
    expireDate: {
      type: Date,
      required: true
    },
    isExpired: {
        type: Boolean,
        default: false
    },
    isNotified: {
        type: Boolean,
        default: false
    },
},
{ timestamps: true }
);


const MySubscription = mongoose.model<IMySubscription>("MySubcription", mySubscriptionSchema);

export default MySubscription;
