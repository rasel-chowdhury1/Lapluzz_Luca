import EventEngagementStats from "../eventEngagementStats/eventEngagementStats.model";
import EventReview from "../eventReview/eventReview.model";

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

