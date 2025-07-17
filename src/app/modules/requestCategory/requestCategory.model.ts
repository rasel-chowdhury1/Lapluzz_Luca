import { Schema, model } from 'mongoose';
import { IRequestedCategory } from './requestCategory.interface';

const RequestedCategorySchema = new Schema<IRequestedCategory>(
  {
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        required: true 
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    }, // 👈 added field
  },
  {
    timestamps: true,
  }
);

const RequestedCategory = model<IRequestedCategory>('RequestedCategory', RequestedCategorySchema);
export default RequestedCategory;
