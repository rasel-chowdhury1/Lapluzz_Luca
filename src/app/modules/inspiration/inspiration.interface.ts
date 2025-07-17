import { ObjectId, Types } from 'mongoose';

export type InspirationType = 'blog' | 'gallery';

export interface IInspiration {
  author: ObjectId;
  title: string;
  category: Types.ObjectId;
  type: InspirationType;
  description?: string | null;
  coverImage: string;
  imageGallery?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}
