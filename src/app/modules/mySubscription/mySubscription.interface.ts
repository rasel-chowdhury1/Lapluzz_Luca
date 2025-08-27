
import { ObjectId, Types } from "mongoose";
import { SubscriptionForType } from "../subscriptionPayment/subscriptionpayment.interface";

export interface IMySubscription {
    _id?: string;
    user: ObjectId;
    subscriptionPaymentId: ObjectId;
    expiryDate: Date;
    subscriptionFor: Types.ObjectId;
    subscriptionForType: SubscriptionForType;
    subscription: Types.ObjectId;
    subscriptionOptionIndex?: number;
    subscriptionPriorityLevel?: number;
    subscriptionType?: string;
    payment_method: string;
    payment_status: string;
    paymentType: string;
    status: string;
    expireDate: Date;
    isExpired?: boolean;
    isNotified?: boolean;
}
