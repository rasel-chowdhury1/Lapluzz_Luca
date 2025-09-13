import mongoose, { Schema } from 'mongoose';
import { ISubscriptionPayment } from './subscriptionpayment.interface';

const subscriptionPaymentSchema: Schema = new Schema<ISubscriptionPayment>(
  {
    paymentId: {
      type: String,
      required: true,
    },
    transaction_id: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    woo_order_id: {
      type: String,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
    },
    amount_cents: {
      type: Number,
      default: 0,
    },   
    currency: {
      type: String,
      default: ""
    },
    customer_name: {
      type: String,
      default: ""
    },
    customer_email: {
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
    subcriptionDays: {
      type: Number,
      default: 0
    },
    subscriptionPriorityLevel: { 
        type: Number, 
        required: true 
    },
    subscriptionType: { 
        type: String, 
        enum: ['exclusive','elite','prime', 'diamond', 'emerald', 'ruby','visualTop', 'visualMedia', 'visualBase','custom',],
        required: true 
    },
    payment_method: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      default: "",
    },
    useCredits: {
      type: Number,
      default: 0
    },
    paymentType: {
      type: String,
      enum: ["credit","payment", "creditWithPayment" ],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "on-hold","cancelled","completed", "refunded","failed"  ],
      default: "pending"
    },
    userStatus: {
        type: String,
        enum: ["pending","notActivate", "activate", "stop", "gotCredits"],
        default: "pending"
    }, 
    couponCode: {
      type: String,
      default: null
    },
    subBlueVerifiedBadge: {
      type: Boolean,
      default: false
    },
    autoRefundAmount: {
      type: Number,
      default: 0
    },
    gotCredits: {
        type: Number,
        default: 0
    },
    activateExpireDays:{
      type: Number,
      default: 0
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
