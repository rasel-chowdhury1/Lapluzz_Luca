import { Schema, model } from 'mongoose';
import {
  IBusinessProfileViews,
  IBusinessProfileViewsModel
} from './businessProfileViews.interface';

// Subschema for user view
const ViewUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const businessProfileViewsSchema = new Schema<IBusinessProfileViews>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      unique: true
    },
    viewUsers: {
      type: [ViewUserSchema],
      default: []
    }
  },
  { timestamps: true }
);

const BusinessProfileViews = model<IBusinessProfileViews, IBusinessProfileViewsModel>(
  'BusinessProfileViews',
  businessProfileViewsSchema
);

export default BusinessProfileViews;
