import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import Event from './event.model';
import { IEvent } from './event.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { buildLocation } from '../../utils/buildLocation';
import EventReview from '../eventReview/eventReview.model';
import EventEngagementStats from '../eventEngagementStats/eventEngagementStats.model';
import EventProfileViews from '../eventProfileViews/eventProfileViews.model';
import mongoose, { Types } from 'mongoose';
import { User } from '../user/user.models';
import { monthNames } from '../business/business.utils';
import { EventInterestUserList } from '../eventInterest/eventInterest.model';

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

const getEventList = async () => {
  const events = await Event.find({ isDeleted: false }).lean();

  const results = await Promise.all(
    events.map(async (event) => {
      const eventId = new Types.ObjectId(event._id);

      // 1️⃣ Likes & Comments
      const engagement = await EventEngagementStats.findOne({ eventId }).lean();
      const totalLikes = engagement?.likes?.length || 0;
      const totalComments = engagement?.comments?.length || 0;

      // 2️⃣ Views
      const viewsDoc = await EventProfileViews.findOne({ eventId }).lean();
      const profileViews = viewsDoc?.viewUsers?.length || 0;

      // 3️⃣ Rating & Reviews
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

      const ratingStats = ratingAgg[0] || {
        averageRating: 0,
        totalReviews: 0,
      };

      return {
        ...event,
        totalLikes,
        totalComments,
        eventViews: profileViews,
        averageRating: parseFloat(ratingStats.averageRating?.toFixed(1)) || 0,
        totalReviews: ratingStats.totalReviews,
      };
    })
  );

  return results;
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

  // console.log("event body data ->>> ")
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

const getSpecificEventStats = async (eventId: string) => {
  const id = new Types.ObjectId(eventId);

  // 1️⃣ Check event existence and status
  const event = await Event.findOne({ _id: id, isDeleted: false }).lean();
  if (!event) {
    throw new Error('event not found');
  }

  const authorId = event.author;

  // // ⭐ Get totalCredits of the author
  // const author = await User.findById(authorId).select('totalCredits').lean();
 

  // 2️⃣ Get engagement stats (followers, likes, comments)
  const engagement = await EventEngagementStats.findOne({ eventId: id }).lean();
  const totalLikes = engagement?.likes?.length || 0;
  const totalComments = engagement?.comments?.length || 0;

  // 3️⃣ Get profile views & monthly breakdown
  const viewsDoc = await EventProfileViews.findOne({ eventId: id }).lean();
  const viewUsers = viewsDoc?.viewUsers || [];
  const profileViews = viewUsers.length;

    const monthlyCounts = Array(12).fill(0);
  viewUsers.forEach((view: { viewedAt: Date }) => {
    const date = new Date(view.viewedAt);
    if (!isNaN(date.getTime())) {
      const month = date.getMonth(); // 0 to 11
      monthlyCounts[month]++;
    }
  });

  const monthlyViews = monthNames.map((month, index) => ({
    month,
    totalViews: monthlyCounts[index]
  }));

  // 4️⃣ Get average rating & total reviews
  const ratingAgg = await EventReview.aggregate([
    { $match: { eventId: id } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const ratingStats = ratingAgg[0] || {
    averageRating: 0,
    totalReviews: 0
  };

  // 5️⃣ Get active subscription info
  const now = new Date();
  const activeSubscriptions = Event.subscriptionList?.filter(
    (sub) => sub.expireDate && new Date(sub.expireDate) > now
  ) || [];

  const activeSubscription = activeSubscriptions[0] || null;
  const totalActiveSub = activeSubscriptions.length;

    // 3️⃣ Get profile views & monthly breakdown
  const interestsDoc = await EventInterestUserList.findOne({ eventId: id }).lean();
  const interestsUsers = interestsDoc?.interestUsers.length || 0;

  // ✅ Final return object
  return {
    eventId,
    totalLikes,
    totalComments,
    eventViews: profileViews,
    monthlyViews,
    averageRating: parseFloat(ratingStats.averageRating?.toFixed(1)) || 0,
    totalReviews: ratingStats.totalReviews,
    activeSubscription: activeSubscription
      ? {
          type: activeSubscription.type,
          expireDate: activeSubscription.expireDate
        }
      : null,
    totalActiveSub,
    interestsUsers
  };
};

const getMyEventList = async (userId: string) => {
  console.log({userId})
  const events = await Event.find({ author: userId, isDeleted: false }).select("name");

  if (!events.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No events found for this user');
  }
  
  return events;
  
};

const updateEvent = async (
  eventId: string,
  updateData: Partial<IEvent>
) => {
 
 const updatedEvent = await Event.findByIdAndUpdate( eventId, updateData, {new: true})

  return updatedEvent;
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
  getExtraEventDataById,
  getMyEventList,
  getSpecificEventStats,
  getEventList
};
