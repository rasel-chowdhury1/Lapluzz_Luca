import EventProfileViews from './eventProfileViews.model';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const addView = async (eventId: string, userId: string) => {
  const result = await EventProfileViews.findOneAndUpdate(
    { eventId },
    {
      $push: {
        viewUsers: {
          user: userId,
          viewedAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  );

  return result;
};

const getViewsByEvent = async (eventId: string) => {
  const result = await EventProfileViews.findOne({ eventId })
    .populate('viewUsers.user', 'name email profileImage');

  if (!result) {
    return null;
    // throw new AppError(httpStatus.NOT_FOUND, 'No views found for this event');
  }

  return result;
};

export const eventProfileViewsService = {
  addView,
  getViewsByEvent
};
