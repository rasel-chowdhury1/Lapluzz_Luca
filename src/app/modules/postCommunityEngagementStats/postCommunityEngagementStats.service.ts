import PostCommunityEngagementStats from './postCommunityEngagementStats.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';

const likePost = async (postId: string, userId: string) => {
  const engagement = await PostCommunityEngagementStats.findOneAndUpdate(
    { postId },
    { $addToSet: { likes: userId } },
    { upsert: true, new: true }
  );

 
  return engagement;
};

const unlikePost = async (postId: string, userId: string) => {

  console.log("unlike post id and userId :--> ", postId, userId)
  const engagement = await PostCommunityEngagementStats.findOneAndUpdate(
    { postId },
    { $pull: { likes: userId } },
    { new: true }
  );
  return engagement;
};

const addComment = async (postId: string, userId: string, text: string) => {
  const engagement = await PostCommunityEngagementStats.findOneAndUpdate(
    { postId },
    { $push: { comments: { user: userId, text } } },
    { upsert: true, new: true }
  );
  return engagement;
};

const getStats = async (postId: string) => {
  const stats = await PostCommunityEngagementStats.findOne({ postId })
    .populate('likes', 'name email')
    .populate('comments.user', 'name email');

  if (!stats) {
    throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found');
  }

  return stats;
};


const getPostCommunityComments = async (postId: string) => {
  const stats = await PostCommunityEngagementStats.findOne({ postId })
    .select('comments')
    .populate('comments.user', 'name profileImage');

  if (!stats) {
    throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found for this post');
  }

  return stats.comments;
};

export const postCommunityEngagementStatsService = {
  likePost,
  unlikePost,
  addComment,
  getStats,
  getPostCommunityComments
};
