
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import BusinessEngagementStats from './businessEngaagementStats.model';

const likeBusiness = async (businessId: string, userId: string) => {
  const result =  await BusinessEngagementStats.findOneAndUpdate(
    { businessId },
    { $addToSet: { likes: userId } },
    { upsert: true, new: true }
  );
  console.log("result data ->>> ", result)
  return result;
};

const unlikeBusiness = async (businessId: string, userId: string) => {
  return await BusinessEngagementStats.findOneAndUpdate(
    { businessId },
    { $pull: { likes: userId } },
    { new: true }
  );
};

const followBusiness = async (businessId: string, userId: string) => {
  return await BusinessEngagementStats.findOneAndUpdate(
    { businessId },
    { $addToSet: { followers: userId } },
    { upsert: true, new: true }
  );
};

const unfollowBusiness = async (businessId: string, userId: string) => {
  return await BusinessEngagementStats.findOneAndUpdate(
    { businessId },
    { $pull: { followers: userId } },
    { new: true }
  );
};

const commentBusiness = async (businessId: string, userId: string, text: string) => {
  return await BusinessEngagementStats.findOneAndUpdate(
    { businessId },
    { $push: { comments: { user: userId, text } } },
    { upsert: true, new: true }
  );
};

const getStats = async (businessId: string) => {
  const stats = await BusinessEngagementStats.findOne({ businessId })
    .populate('likes', 'name email')
    .populate('followers', 'name email')
    .populate('comments.user', 'name email');

  // if (!stats) throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found');

  return stats || null;
};

const getBusinessComments = async (businessId: string) => {
  const stats = await BusinessEngagementStats.findOne({ businessId })
    .select('comments') // only select comments
    .populate('comments.user', 'name profileImage');

  // if (!stats) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found for this business');
  // }

  return stats?.comments || null;
};

export const businessEngagementStatsService = {
  likeBusiness,
  unlikeBusiness,
  followBusiness,
  unfollowBusiness,
  commentBusiness,
  getStats,
  getBusinessComments
};
