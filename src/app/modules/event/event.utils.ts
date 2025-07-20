import { NextFunction, Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import EventEngagementStats from "../eventEngagementStats/eventEngagementStats.model";
import EventReview from "../eventReview/eventReview.model";
import Event from "./event.model";
import sendResponse from "../../utils/sendResponse";


export const verifyEventOwnership = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { eventId } = req.params;
    const userId = req.user?.userId; // Ensure this is coming from your JWT payload

    // Check if the event exists
    const event = await Event.findById(eventId)
    if (!event) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "event not found.",
        data: null,
      });
    }

    // Check if the authenticated user is the owner
    if (String(event.author) !== String(userId)) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: "You are not authorized to perform this action.",
        data: null,
      });
    }

    // All good, proceed to the next middleware
    next();
  });
};
export const enrichEvent = async (event: any, userId: string) => {
  const eventId = event._id;

  // ⭐ Rating
  const ratingAgg = await EventReview.aggregate([
    { $match: { eventId } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  const rating = ratingAgg[0] || { averageRating: 0, totalReviews: 0 };

  // ⭐ Engagement
  const engagement = await EventEngagementStats.findOne({ eventId }).select('likes comments');
  const engagementInfo = {
    totalLikes: engagement?.likes?.length || 0,
    totalComments: engagement?.comments?.length || 0,
    isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
  };

  // ⭐ Reviews
  const reviews = await EventReview.find({ eventId })
    .populate('userId', 'name profileImage')
    .select('rating comment')
    .sort({ createdAt: -1 });

  return {
    ...event.toObject(),
    averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
    totalReviews: rating.totalReviews || 0,
    totalLikes: engagementInfo.totalLikes,
    totalComments: engagementInfo.totalComments,
    isLiked: engagementInfo.isLiked,
    blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType),
    reviews,
  };
};

