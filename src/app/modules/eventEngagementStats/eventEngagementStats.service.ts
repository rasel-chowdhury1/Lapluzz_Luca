import EventEngagementStats from './eventEngagementStats.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';

const likeEvent = async (eventId: string, userId: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $addToSet: { likes: userId } },
    { upsert: true, new: true }
  );
  return engagement;
};

const unlikeEvent = async (eventId: string, userId: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $pull: { likes: userId } },
    { new: true }
  );
  return engagement;
};

const addComment = async (eventId: string, userId: string, text: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $push: { comments: { user: userId, text } } },
    { upsert: true, new: true }
  );
  return engagement;
};

const getStats = async (eventId: string) => {
  const stats = await EventEngagementStats.findOne({ eventId })
    .populate('likes', 'name email')
    .populate('comments.user', 'name email');

  if (!stats) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found');
    return null
  }

  return stats;
};

const getEventComments = async (eventId: string) => {
  const stats = await EventEngagementStats.findOne({ eventId })
    .select('comments') // only select comments
    .populate('comments.user', 'name profileImage');

  if (!stats) {
    return null;
    // throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found for this business');
  }

  return stats.comments;
};




export const eventEngagementStatsService = {
  likeEvent,
  unlikeEvent,
  addComment,
  getStats,
  getEventComments
};
