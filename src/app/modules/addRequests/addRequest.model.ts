import { model, Schema } from 'mongoose';
import { IAddRequests, IAddRequestsModules } from './addRequest.interface';

const addRequestsSchema = new Schema<IAddRequests>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
);

const AddRequests = model<IAddRequests, IAddRequestsModules>(
  'AddRequests',
  addRequestsSchema,
);
export default AddRequests;