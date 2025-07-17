import { Types } from 'mongoose';
import { EventInterestUserList } from './eventInterest.model';

const addInterestUser = async (eventId: string, userId: string) => {
  return await EventInterestUserList.findOneAndUpdate(
    { eventId: new Types.ObjectId(eventId) },
    {
      $addToSet: {
        interestUsers: {
          user: new Types.ObjectId(userId),
          interestedAt: new Date(),
        },
      },
    },
    { upsert: true, new: true }
  );
};

const getInterestUsers = async (eventId: string) => {
  return await EventInterestUserList.findOne({ eventId })
    .populate('interestUsers.user', 'name profileImage')
    .select('interestUsers');
};


export const EventInterestService = {
    addInterestUser, 
    getInterestUsers
}