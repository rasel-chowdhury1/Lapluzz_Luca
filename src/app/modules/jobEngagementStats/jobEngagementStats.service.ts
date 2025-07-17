import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import JobEngagementStats from './jobEngagementStats.model';

const addComment = async (jobId: string, userId: string, text: string) => {
  let engagement = await JobEngagementStats.findOne({ jobId });

  if (!engagement) {
    engagement = await JobEngagementStats.create({
      jobId,
      comments: [{ user: userId, text }]
    });
  } else {
    engagement.comments.push({ user: userId, text });
    await engagement.save();
  }

  return engagement;
};

const getEngagementStats = async (jobId: string) => {
  const stats = await JobEngagementStats.findOne({ jobId }).populate('comments.user', 'name email');
  if (!stats) {
    throw new AppError(httpStatus.NOT_FOUND, 'Engagement stats not found for this job');
  }
  return stats;
};

export const jobEngagementStatsService = {
  addComment,
  getEngagementStats
};
