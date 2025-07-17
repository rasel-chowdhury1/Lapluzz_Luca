import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import EventReview from './eventReview.model';
import { IEventReview } from './eventReview.interface';

const createReview = async (payload: IEventReview) => {
  const existing = await EventReview.findOne({
    eventId: payload.eventId,
    userId: payload.userId
  });

  if (existing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You already reviewed this event.');
  }

  const result = await EventReview.create(payload);
  return result;
};

const getReviewsByEvent = async (eventId: string) => {
  return await EventReview.find({ eventId }).populate('userId', 'name email');
};

const deleteReview = async (reviewId: string, userId: string) => {
  const review = await EventReview.findById(reviewId);
  if (!review) throw new AppError(httpStatus.NOT_FOUND, 'Review not found');

  if (review.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Unauthorized to delete this review');
  }

  await EventReview.findByIdAndDelete(reviewId);
  return { message: 'Review deleted successfully' };
};

export const eventReviewService = {
  createReview,
  getReviewsByEvent,
  deleteReview
};
