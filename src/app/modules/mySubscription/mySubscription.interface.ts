
import { ObjectId, Types } from "mongoose";
import { SubscriptionForType } from "../subscriptionPayment/subscriptionpayment.interface";

export interface IMySubscription {
    _id?: string;
    user: ObjectId;
    expiryDate: Date;
    subscriptionFor: Types.ObjectId;
    subscriptionForType: SubscriptionForType;
    subscription: Types.ObjectId;
    subscriptionOptionIndex?: Number;
    payment_method: string;
    payment_status: string;
    status: string;
    isExpired?: boolean;
    isNotified?: boolean;
}
