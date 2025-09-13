
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
    subcriptionDays: number;
    subBlueVerifiedBadge: boolean;
    subscriptionPriorityLevel?: number;
    subscriptionType?: string;
    payment_method: string;
    payment_status: string;
    useCredits: number;
    paymentType: string;
    status: string;
    gotCredits: number;
    autoRefundAmount: number;
    activateExpireDays?: number;
    activateExpireDate?: Date | null;
    activateDate?: Date | null;
    stopDate?: Date | null;
    autoExpireDate: Date | null;
    expireDate: Date;
    isExpired?: boolean;
    isNotified?: boolean;
}
