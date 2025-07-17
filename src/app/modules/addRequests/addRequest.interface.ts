import { Model, ObjectId } from 'mongoose';

export interface IAddRequests {
  user: ObjectId;
  type: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type IAddRequestsModules = Model<IAddRequests, Record<string, unknown>>;