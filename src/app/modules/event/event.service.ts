import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import Event from './event.model';
import { IEvent } from './event.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { buildLocation } from '../../utils/buildLocation';
import EventReview from '../eventReview/eventReview.model';
import EventEngagementStats from '../eventEngagementStats/eventEngagementStats.model';
import EventProfileViews from '../eventProfileViews/eventProfileViews.model';
import mongoose from 'mongoose';

const createEvent = async (payload: IEvent) => {
  const { longitude, latitude, ...rest } = payload;
  // Build location if coordinates are provided
  if (longitude !== undefined && latitude !== undefined) {
    rest.location = buildLocation(longitude, latitude) as any;
  }
  const result = await Event.create(payload);

  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create event');

  return result;
};

const getAllEvents = async (query: Record<string, any>) => {
  query['isDeleted'] = false;
  const queryBuilder = new QueryBuilder(Event.find(), query)
    .search(['name', 'email', 'phoneNumber', 'address', 'category', 'type'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  return { data, meta };
};

// const getSubscrptionEvent = async (query: Record<string, any>) => {
//   query['isDeleted'] = false;

//     const baseQuery = Event.find({isSubscription: true})

//   const eventModel = new QueryBuilder(Event.find(), query)
//     .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
//     .filter()
//     .paginate()
//     .fields();

//   let data = await eventModel.modelQuery;
//   const meta = await eventModel.countTotal();

//   if (!data || data.length === 0) return { data, meta };

//   const subscriptionOrder = ['diamond','emerald','ruby','none'];

//   data = data.sort((a, b) => {
//     const indexA = subscriptionOrder.indexOf(a.subscriptionType ?? '');
//     const indexB = subscriptionOrder.indexOf(b.subscriptionType ?? '');

//     const posA = indexA === -1 ? subscriptionOrder.length : indexA;
//     const posB = indexB === -1 ? subscriptionOrder.length : indexB;

//     if (posA !== posB) {
//       return posA - posB;
//     }

//     const dateA = new Date(a.createdAt).getTime();
//     const dateB = new Date(b.createdAt).getTime();

//     return dateB - dateA; // newest first
//   });

//   return { data, meta };
// };


const getSubscrptionEvent = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;

  const baseQuery = Event.find({ isSubscription: true });

  const eventModel = new QueryBuilder(baseQuery, query)
    .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await eventModel.modelQuery;
  const meta = await eventModel.countTotal();

  if (!data || data.length === 0) return { data, meta };

  const eventIds = data.map((event) => event._id);

  // ⭐ Aggregate reviews
  const ratings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap: Record<
    string,
    { averageRating: number; totalReviews: number }
  > = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ Get engagement stats
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select('eventId likes comments');

  const engagementMap: Record<
    string,
    { totalLikes: number; totalComments: number; isLiked: boolean }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };
  });

  // 🔀 Merge into final response
  data = data.map((event) => {
    const id = event._id.toString();

    const ratingInfo = ratingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    const engagementInfo = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
    };

    return {
      ...event.toObject(),
      ...ratingInfo,
      ...engagementInfo,
      blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType), // you can change rule
    };
  });

  // 🔽 Sort by subscription tier then newest
  const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data, meta };
};


// const getUnsubscriptionEvent = async (query: Record<string, any>) => {
//   query['isDeleted'] = false;


//   console.log({query})

//   const eventModel = new QueryBuilder(Event.find({isSubscription: false}), query)
//     .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
//     .filter()
//     .paginate()
//     .sort()
//     .fields();

//   const data = await eventModel.modelQuery;
//   const meta = await eventModel.countTotal();

//   return { data, meta };
// };

const getUnsubscriptionEvent = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;

  const eventModel = new QueryBuilder(Event.find(), query)
    .search(['name', 'email', 'phoneNumber', 'address'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await eventModel.modelQuery;
  const meta = await eventModel.countTotal();

  console.log("event body data ->>> ")
  console.log({data,meta})

  if (!data || data.length === 0) return { data, meta };

  const eventIds = data.map((event) => event._id);

  // ⭐ Get reviews
  const ratings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap: Record<
    string,
    { averageRating: number; totalReviews: number }
  > = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ Get engagement
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select('eventId likes comments');

  const engagementMap: Record<
    string,
    {
      totalLikes: number;
      totalComments: number;
      isLiked: boolean;
    }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };
  });

  // 🔀 Merge data
  data = data.map((event) => {
    const id = event._id.toString();

    const ratingInfo = ratingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    const engagementInfo = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
    };

    return {
      ...event.toObject(),
      ...ratingInfo,
      ...engagementInfo,
    };
  });

  return { data, meta };
};

// const getEventById = async (id: string) => {
//   const result = await Event.findById(id);
//   if (!result || result.isDeleted) throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
//   return result;
// };

const getEventById = async (userId: string, id: string) => {
  const event = await Event.findById(id);

  if (!event || event.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  

  const eventId = event._id;

  // 🔄 Log view in background
  EventProfileViews.findOneAndUpdate(
    { eventId },
    { $addToSet: { viewUsers: {
        user: new mongoose.Types.ObjectId(userId),
        viewedAt: new Date(),
    }
    }
    },
    { new: true, upsert: true }
  ).exec();

  // ⭐ Get Rating
  const ratingAgg = await EventReview.aggregate([
    { $match: { eventId: eventId } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const rating = ratingAgg[0] || {
    averageRating: 0,
    totalReviews: 0,
  };

  // ⭐ Get Engagement Stats
  const engagement = await EventEngagementStats.findOne({ eventId })
    .select('likes comments');

  const engagementInfo = {
    totalLikes: engagement?.likes?.length || 0,
    totalComments: engagement?.comments?.length || 0,
    isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
  };

  // ⭐ Get All Reviews (latest first)
  const reviews = await EventReview.find({ eventId })
    .populate('userId', 'name profileImage')
    .select('rating comment')
    .sort({ createdAt: -1 });

  // ✅ Final enriched object
  return {
    ...event.toObject(),
    averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
    totalReviews: rating.totalReviews || 0,
    totalLikes: engagementInfo.totalLikes,
    totalComments: engagementInfo.totalComments,
    isLiked: engagementInfo.isLiked,
    blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType),
    reviews
  };
};

const getMyEvents = async (userId: string) => {
  console.log({userId})
  const events = await Event.find({ author: userId, isDeleted: false });

  if (!events.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No events found for this user');
  }

  console.log({events})
  // Enrich all events with engagement, rating, and review data
  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      const eventId = event._id;

      // 🔄 Update view history (as background)
      EventProfileViews.findOneAndUpdate(
        { eventId },
        {
          $addToSet: {
            viewUsers: {
              user: new mongoose.Types.ObjectId(userId),
              viewedAt: new Date(),
            },
          },
        },
        { new: true, upsert: true }
      ).exec();

      // ⭐ Get rating info
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

      const rating = ratingAgg[0] || {
        averageRating: 0,
        totalReviews: 0,
      };

      // ⭐ Get engagement stats
      const engagement = await EventEngagementStats.findOne({ eventId }).select('likes comments');

      const engagementInfo = {
        totalLikes: engagement?.likes?.length || 0,
        totalComments: engagement?.comments?.length || 0,
        isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
      };

      // ⭐ Get reviews
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
    })
  );

  return enrichedEvents;
};

const updateEvent = async (
  id: string,
  updatePayload: Partial<IEvent>,
  userId: string
) => {
  const existingEvent = await Event.findById(id);

  if (!existingEvent || existingEvent.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  // Optional: enforce that only the author can update
  if (existingEvent.author.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Unauthorized to update this event');
  }

  Object.assign(existingEvent, updatePayload);
  await existingEvent.save();

  return existingEvent;
};

const getExtraEventDataById = async (
  eventId: string,  userId: string
) => {
  const existingEvent = await Event.findById(eventId);

  if (!existingEvent || existingEvent.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

    const comment = await EventEngagementStats.findOne({ eventId })
    .select('comments') // only select comments
    .populate('comments.user', 'name profileImage') || [];

  return {
    comment
  };
};


const deleteEvent = async (id: string) => {
  const result = await Event.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete event');
  return result;
};

export const eventService = {
  createEvent,
  getAllEvents,
  getSubscrptionEvent,
  getUnsubscriptionEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getExtraEventDataById
};
