import { Schema, model } from 'mongoose';
import { IInspiration } from './inspiration.interface';

const inspirationSchema = new Schema<IInspiration>(
  {
    author: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Categories', required: true },
    type: {
      type: String,
      enum: ['blog', 'gallery'],
      required: true
    },
    description: { type: String, default: null },
    coverImage: { type: String, required: true },
    imageGallery: { type: [String], default: null },
    isBlocked: {type: Boolean, default: false},
    isDeleted: {type: Boolean, default: false}
  },
  { timestamps: true }
);

export const Inspiration = model<IInspiration>('Inspiration', inspirationSchema);
