import mongoose, { Schema } from 'mongoose';
import { ISubscriptionPayment } from './subscriptionpayment.interface';

const subscriptionPaymentSchema: Schema = new Schema<ISubscriptionPayment>(
  {
    paymentId: {
      type: String,
      required: true,
    },
    woo_order_id: {
      type: String,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    billing_email: {
      type: String,
      default: ""
    },
    billing_first_name: {
      type: String,
      default: ""
    },
    billing_last_name: {
      type: String,
      default: ""
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
    payment_method: {
      type: String,
      enum: ['Card', 'Paypal', 'Klarna', 'Bank', "Credit", "Manual"],
      default: 'Card',
    },
    status: {
      type: String,
      enum: ["pending","reminder_1","reminder_2","reminder_3","reminder_4","success", "activate", "stop", "gotCredits", "Completato"],
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
