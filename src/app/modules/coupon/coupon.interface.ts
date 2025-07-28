import { Document } from 'mongoose';

export interface ICoupon {
  name: string;
  discountPrice: number;
  startDate: Date;
  endDate: Date;
  appliesTo: string; // could also be enum or array depending on logic
  usageLimit: number;
  isEnable: boolean;
  isDeleted: boolean;
}

export interface ICouponDocument extends ICoupon, Document {}
