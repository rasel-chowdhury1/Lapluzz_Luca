import mongoose, { Schema } from "mongoose";
import { IMySubscription } from "./mySubscription.interface";


const mySubscriptionSchema = new Schema<IMySubscription>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPayment',
        unique: true
    },
    expiryDate: { type: Date, required: true },
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
    subscriptionPriorityLevel: { 
        type: Number, 
        required: true 
    },
    subscriptionType: { 
        type: String, 
        enum: ['none','exclusive','elite','prime', 'custom'],
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
    paymentType: {
      type: String,
      enum: ["credit","payment"],
    },
    status: {
        type: String,
        enum: ["notActivate", "activate", "stop", "gotCredits"],
        default: "notActivate"
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
});


const MySubscription = mongoose.model<IMySubscription>("MySubcription", mySubscriptionSchema);

export default MySubscription;
