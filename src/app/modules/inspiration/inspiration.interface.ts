import { ObjectId, Types } from 'mongoose';

export type InspirationType = 'blog' | 'gallery';

export interface IInspiration {
  author: ObjectId;
  title: string;
  category: Types.ObjectId;
  subCategory: string;
  type: InspirationType;
  description?: string | null;
  coverImage: string;
  imageGallery?: string[] | null;
  isBlocked: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
