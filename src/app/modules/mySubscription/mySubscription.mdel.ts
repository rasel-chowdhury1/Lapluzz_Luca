import mongoose, { Schema } from "mongoose";
import { IMySubscription } from "./mySubscription.interface";


const mySubscriptionSchema = new Schema<IMySubscription>({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
    payment_method: {
        type: String,
        default: '',
    },
    payment_status: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ["notActivate", "activate", "stop", "gotCredits"],
        default: "notActivate"
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
