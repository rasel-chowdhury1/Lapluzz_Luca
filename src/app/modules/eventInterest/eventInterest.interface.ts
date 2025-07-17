import { Types } from 'mongoose';

export interface IEventInterest {
  eventId: Types.ObjectId;
  interestUsers: {
    user: Types.ObjectId;
    interestedAt: Date;
  }[];
}
