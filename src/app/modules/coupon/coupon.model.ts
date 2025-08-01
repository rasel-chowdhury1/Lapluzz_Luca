import { Schema, model } from 'mongoose';
import { ICouponDocument } from './coupon.interface';

const couponSchema = new Schema<ICouponDocument>(
  {
    name: { type: String, required: true, unique: true },
    discountPrice: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    appliesTo: { type: String, enum: ["all", "business", "event", "job"], required: true }, // can adjust based on use-case
    usageLimit: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    isEnable: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Coupon = model<ICouponDocument>('Coupon', couponSchema);
