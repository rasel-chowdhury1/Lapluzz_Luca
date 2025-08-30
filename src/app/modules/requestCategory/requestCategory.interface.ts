import { Document, ObjectId} from 'mongoose';

export interface IRequestedCategory extends Document {
  name: string;
  type: string;
  user: ObjectId;
  isNotified: boolean;
  isDeleted: boolean;
}
