import JobProfileViews from './jobProfileViews.model';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const addView = async (jobId: string, userId: string) => {
  const result = await JobProfileViews.findOneAndUpdate(
    { jobId },
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

const getViewsByJob = async (jobId: string) => {
  const result = await JobProfileViews.findOne({ jobId })
    .populate('viewUsers.user', 'name email profileImage');

  if (!result) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No views found for this job');
    return null;
  }

  return result;
};

export const jobProfileViewsService = {
  addView,
  getViewsByJob
};
