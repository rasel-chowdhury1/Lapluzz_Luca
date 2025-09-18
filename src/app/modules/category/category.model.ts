import { model, Schema } from 'mongoose';
import { ICategory, ICategoryModel } from './category.interface';

const categorySchema = new Schema<ICategory>(
  {
    name: { type: 'string', required: true },
    type: {
      type: 'string',
      required: true,
      enum: [
        'Event',
        'Provider',
        'job',
        'sopportedServices',
        'extraServices',
        'inspiration',
        'community'
      ],
    },
    subcategory: {
      type: 'string',
      default: ""
    },
    description: { type: 'string', required: false, default: "" },
    icon: { type: 'string', required: false, default: "" },
    banner: { type: 'string', required: false, default: "" },
    isDeleted: { type: 'boolean', default: false },
  },
  {
    timestamps: true,
  },
);

categorySchema.statics.isExistByName = async function (name: string) {
  return await Category.findOne({ name });
};

const Category = model<ICategory, ICategoryModel>('Categories', categorySchema);
export default Category;