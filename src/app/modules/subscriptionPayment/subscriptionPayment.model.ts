import mongoose, { Schema } from 'mongoose';
import { ISubscriptionPayment } from './subscriptionpayment.interface';

const subscriptionPaymentSchema: Schema = new Schema<ISubscriptionPayment>(
  {
    paymentId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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
    paymentType: {
      type: String,
      enum: ['Card', 'Paypal', 'Klarna', 'Bank', "Credit"],
      default: 'Card',
    },
    status: {
      type: String,
      enum: ["pending","notActivate", "activate", "stop", "gotCredits"],
      default: "pending"
    },
    expireDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const SubscriptionPayment = mongoose.model<ISubscriptionPayment>(
  'SubscriptionPayment',
  subscriptionPaymentSchema
);

export default SubscriptionPayment;
