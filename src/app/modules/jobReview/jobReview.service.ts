import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import JobReview from './jobReview.model';
import { IJobReview } from './jobReview.interface';

const createReview = async (payload: IJobReview) => {
  const existing = await JobReview.findOne({
    jobId: payload.jobId,
    userId: payload.userId
  });

  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You have already reviewed this job.');
  }

  const result = await JobReview.create(payload);
  return result;
};

const getReviewsByJob = async (jobId: string) => {
  return await JobReview.find({ jobId }).populate('userId', 'name email');
};

const deleteReview = async (reviewId: string, userId: string) => {
  const review = await JobReview.findById(reviewId);
  if (!review) {
    // throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
    return null;
  }

  if (review.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to delete this review');
  }

  await JobReview.findByIdAndDelete(reviewId);
  return { message: 'Review deleted successfully' };
};

export const jobReviewService = {
  createReview,
  getReviewsByJob,
  deleteReview
};
