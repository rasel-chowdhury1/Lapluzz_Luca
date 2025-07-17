import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import BusinessReview from './businessReview.model';
import { IBusinessReview } from './businessReivew.interface';

const createReview = async (payload: IBusinessReview) => {

  const result = await BusinessReview.create(payload);

  return result;
};

const getReviewsByBusiness = async (businessId: string) => {
  return await BusinessReview.find({ businessId }).populate('userId', 'name email');
};

const deleteReview = async (reviewId: string, userId: string) => {
  const review = await BusinessReview.findById(reviewId);
  if (!review) throw new AppError(httpStatus.NOT_FOUND, 'Review not found');

  if (review.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Unauthorized to delete this review');
  }

  await BusinessReview.findByIdAndDelete(reviewId);
  return { message: 'Review deleted successfully' };
};

export const businessReviewService = {
  createReview,
  getReviewsByBusiness,
  deleteReview
};
