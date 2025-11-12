import { Schema, model } from 'mongoose';
import { IUseCredits, IUseCreditsModel } from './useCredits.interface';

const UseCreditsSchema = new Schema<IUseCredits>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
      type: String,
      enum: ['paymentSubscription', 'discount', 'gotCredits'],
      required: true,
    },

    businessOwner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: function (this: IUseCredits) {
        return this.type === 'discount'; // ✅ required only for discount
      },
    },

    usedCredits: { type: Number, required: true, min: 0 },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    // ✅ NEW
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const UseCredits = model<IUseCredits, IUseCreditsModel>(
  'UseCredits',
  UseCreditsSchema
);

export default UseCredits;