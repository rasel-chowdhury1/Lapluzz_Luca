import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import Event from './event.model';
import { CompetitionResultOfEvent, IEvent } from './event.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import { buildLocation } from '../../utils/buildLocation';
import EventReview from '../eventReview/eventReview.model';
import EventEngagementStats from '../eventEngagementStats/eventEngagementStats.model';
import EventProfileViews from '../eventProfileViews/eventProfileViews.model';
import mongoose, { Types } from 'mongoose';
import { User } from '../user/user.models';
import { monthNames } from '../business/business.utils';
import { EventInterestUserList } from '../eventInterest/eventInterest.model';
import { enrichEvent } from './event.utils';
import WishList from '../wishlist/wishlist.model';
import Category from '../category/category.model';

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
  const events = await Event.find({ isDeleted: false })
                             .populate('author', 'name profileImage role') // Populate the author field
                             .populate("businessId", 'name')
                            .lean();

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


// const getEventsByLocation = async (
//   userId: string,
//   query: Record<string, any>,
//   userLocation?: { latitude: number; longitude: number }
// ) => {
//   query['isDeleted'] = false;

//   const page = parseInt(query.page) || 1;
//   const limit = parseInt(query.limit) || 10;
//   const skip = (page - 1) * limit;

//   let data: any[] = [];
//   let meta: any = {};

//   // Helper function to get aggregate query
//   const getGeoNearQuery = (isSubscription: boolean) => ({
//     $geoNear: {
//       near: { type: 'Point', coordinates: [query.longitude, query.latitude] },
//       distanceField: 'distance',
//       spherical: true,
//       query: {
//         isSubscription,
//         isDeleted: false,
//         isActive: true,
//         // author: { $ne: new mongoose.Types.ObjectId(userId) },
//       },
//     },
//   });

//   const geoNearQuery = userLocation ? [
//     getGeoNearQuery(true),  // Subscription events
//     getGeoNearQuery(false), // Unsubscription events
//   ] : [];

//   // Aggregate Subscription and Unsubscription Events
//   const aggregateQuerySubscription = geoNearQuery.length 
//     ? Event.aggregate(geoNearQuery[0]) 
//     : Event.find({ isSubscription: true });

//   const aggregateQueryUnsubscription = geoNearQuery.length 
//     ? Event.aggregate(geoNearQuery[1]) 
//     : Event.find({ isSubscription: false });

//   // Fetch Subscription and Unsubscription Events Data
//   const [subscriptionData, unsubscriptionData] = await Promise.all([
//     aggregateQuerySubscription.skip(skip).limit(limit),
//     aggregateQueryUnsubscription.skip(skip).limit(limit)
//   ]);

//   // Merge the results
//   data = [...subscriptionData, ...unsubscriptionData];

//   // Total counts for subscription and unsubscription
//   const totalSubscription = await Event.countDocuments({
//     isSubscription: true,
//     isDeleted: false,
//     isActive: true,
//   });

//   const totalUnsubscription = await Event.countDocuments({
//     isSubscription: false,
//     isDeleted: false,
//     isActive: true,
//   });

//   meta = {
//     page,
//     limit,
//     total: totalSubscription + totalUnsubscription,
//     totalPage: Math.ceil((totalSubscription + totalUnsubscription) / limit),
//   };

//   if (!data || data.length === 0) return { data, meta };

//   const eventIds = data.map((event) => event._id);

//   // ⭐ Ratings
//   const ratings = await EventReview.aggregate([
//     { $match: { eventId: { $in: eventIds } } },
//     {
//       $group: {
//         _id: "$eventId",
//         averageRating: { $avg: "$rating" },
//         totalReviews: { $sum: 1 },
//       },
//     },
//   ]);

//   const ratingMap = ratings.reduce((acc, r) => {
//     acc[r._id.toString()] = {
//       averageRating: parseFloat(r.averageRating.toFixed(1)),
//       totalReviews: r.totalReviews,
//     };
//     return acc;
//   }, {});

//   // ⭐ Engagement
//   const engagementStats = await EventEngagementStats.find({
//     eventId: { $in: eventIds },
//   }).select("eventId likes comments");

//   const engagementMap = engagementStats.reduce((acc, stat) => {
//     const id = stat.eventId.toString();
//     const totalCommentsWithReplies = stat.comments.reduce(
//       (acc, comment) => {
//         acc += 1;
//         if ((comment as any).replies && Array.isArray((comment as any).replies)) {
//           acc += (comment as any).replies.length;
//         }
//         return acc;
//       },
//       0
//     );

//     acc[id] = {
//       totalLikes: stat.likes?.length || 0,
//       totalComments: totalCommentsWithReplies,
//       isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
//     };
//     return acc;
//   }, {});

//   // ⭐ Fetch user wishlist events
//   const wishList = await WishList.findOne({ userId }).lean();
//   const wishListEventIds = new Set<string>();
//   if (wishList?.folders?.length) {
//     wishList.folders.forEach((folder) => {
//       folder.events?.forEach((eid) => wishListEventIds.add(eid.toString()));
//     });
//   }

//   // 🔀 Merge all info
//   data = data.map((event) => {
//     const id = event._id.toString();
//     const ratingInfo = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
//     const engagementInfo = engagementMap[id] || { totalLikes: 0, totalComments: 0, isLiked: false };

//     return {
//       ...event,
//       ...ratingInfo,
//       ...engagementInfo,
//       isWishlisted: wishListEventIds.has(id),
//     };
//   });

//   // 🔽 Sort by subscription tier first, then by creation date
//   const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'none'];
//   data = data.sort((a, b) => {
//     const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
//     const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

//     if (posA !== posB) return posA - posB;
//     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//   });

//   return { data, meta };
// };


const getEventsByLocation = async (
  userId: string,
  query: Record<string, any>,
  userLocation?: { latitude: number; longitude: number }
) => {
  query['isDeleted'] = false;

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  let data: any[] = [];
  let meta: any = {};

  // Helper function to get aggregate query
  const getGeoNearQuery = (isSubscription: boolean) => ({
    $geoNear: {
      near: { type: 'Point', coordinates: [query.longitude, query.latitude] },
      distanceField: 'distance',
      spherical: true,
      query: {
        isSubscription,
        isDeleted: false,
        isActive: true,
      },
    },
  });

  const geoNearQuery = userLocation ? [
    getGeoNearQuery(true),  // Subscription events
    getGeoNearQuery(false), // Unsubscription events
  ] : [];

  // Aggregate Subscription and Unsubscription Events
  const aggregateQuerySubscription = geoNearQuery.length 
    ? Event.aggregate(geoNearQuery[0] as any) 
    : Event.find({ isSubscription: true });

  const aggregateQueryUnsubscription = geoNearQuery.length 
    ? Event.aggregate(geoNearQuery[1] as any) 
    : Event.find({ isSubscription: false });

  // Fetch Subscription and Unsubscription Events Data
  const [subscriptionData, unsubscriptionData] = await Promise.all([
    aggregateQuerySubscription.skip(skip).limit(limit),
    aggregateQueryUnsubscription.skip(skip).limit(limit)
  ]);

  // Merge the results and remove duplicates by _id
  const combinedData = [...subscriptionData, ...unsubscriptionData];
  const eventMap = new Map();
  combinedData.forEach((event) => {
    eventMap.set(event._id.toString(), event); // Ensure unique events by _id
  });
  
  data = Array.from(eventMap.values()); // Convert map values back to an array

  // Total counts for subscription and unsubscription
  const totalSubscription = await Event.countDocuments({
    isSubscription: true,
    isDeleted: false,
    isActive: true,
  });

  const totalUnsubscription = await Event.countDocuments({
    isSubscription: false,
    isDeleted: false,
    isActive: true,
  });

  meta = {
    page,
    limit,
    total: totalSubscription + totalUnsubscription,
    totalPage: Math.ceil((totalSubscription + totalUnsubscription) / limit),
  };

  if (!data || data.length === 0) return { data, meta };

  const eventIds = data.map((event) => event._id);

  // ⭐ Ratings
  const ratings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: "$eventId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap = ratings.reduce((acc, r) => {
    acc[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
    return acc;
  }, {});

  // ⭐ Engagement
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select("eventId likes comments");

  const engagementMap = engagementStats.reduce((acc: any, stat) => {
    const id = stat.eventId.toString();
    const totalCommentsWithReplies = stat.comments.reduce(
      (acc, comment) => {
        acc += 1;
        if ((comment as any).replies && Array.isArray((comment as any).replies)) {
          acc += (comment as any).replies.length;
        }
        return acc;
      },
      0
    );

    acc[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: totalCommentsWithReplies,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };
    return acc;
  }, {});

  // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListEventIds = new Set<string>();
  if (wishList?.folders?.length) {
    wishList.folders.forEach((folder) => {
      folder.events?.forEach((eid) => wishListEventIds.add(eid.toString()));
    });
  }

  // 🔀 Merge all info
  data = data.map((event) => {
    const id = event._id.toString();
    const ratingInfo = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagementInfo = engagementMap[id] || { totalLikes: 0, totalComments: 0, isLiked: false };

    return {
      ...event,
      ...ratingInfo,
      ...engagementInfo,
      isWishlisted: wishListEventIds.has(id),
    };
  });

  // 🔽 Sort by subscription tier first, then by creation date
  const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data, meta };
};



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
      totalComments: 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };

    // ⭐ Calculate total comments including replies
    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      // Count the comment itself
      acc += 1;

      // Count the replies for this comment
      if ((comment as any).replies && Array.isArray((comment as any).replies)) {
        acc += (comment as any).replies.length;
      }

      return acc;
    }, 0);

    // Update totalComments to include both comments and replies
    engagementMap[id].totalComments = totalCommentsWithReplies;
    
  });


  // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListEventIds = new Set<string>();

  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.events?.length) {
        folder.events.forEach((eid) => wishListEventIds.add(eid.toString()));
      }
    });
  }

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
      blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType), 
      isWishlisted: wishListEventIds.has(id), // ✅ true if in wishlist, else false
    };
  }) as any;

  // 🔽 Sort by subscription tier then newest
  const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
  });

  return { data, meta };
};


const getSubscrptionEventByLocation = async (
  userId: string,
  query: Record<string, any>,
  userLocation?: { latitude: number; longitude: number }
) => {
  query['isDeleted'] = false;

  let data: any[] = [];
  let meta: any = {};

  if (userLocation) {
    // 🌍 Geo-location sorting using aggregation
    const { latitude, longitude } = userLocation;

    const aggregateQuery = Event.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          spherical: true,
          query: {
            isSubscription: true,
            isDeleted: false,
            isActive: true,
            // author: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
      },
    ]);

    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    data = await aggregateQuery.skip(skip).limit(limit);

    // Total count
    const total = await Event.countDocuments({
      isSubscription: true,
      isDeleted: false,
      isActive: true,
    });

    meta = {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    };
  } else {
    // 🔹 Normal QueryBuilder flow
    const baseQuery = Event.find({ isSubscription: true });
    const eventModel = new QueryBuilder(baseQuery, query)
      .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
      .filter()
      .paginate()
      .sort()
      .fields();

    data = await eventModel.modelQuery;
    meta = await eventModel.countTotal();
  }

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

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
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

  const engagementMap: Record<string, { totalLikes: number; totalComments: number; isLiked: boolean }> = {};
  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };

    // ⭐ Count comments + replies
    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      acc += 1;
      if ((comment as any).replies && Array.isArray((comment as any).replies)) {
        acc += (comment as any).replies.length;
      }
      return acc;
    }, 0);

    engagementMap[id].totalComments = totalCommentsWithReplies;
  });

  // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListEventIds = new Set<string>();
  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.events?.length) {
        folder.events.forEach((eid) => wishListEventIds.add(eid.toString()));
      }
    });
  }

  // 🔀 Merge all info
  data = data.map((event) => {
    const id = event._id.toString();

    const ratingInfo = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagementInfo = engagementMap[id] || { totalLikes: 0, totalComments: 0, isLiked: false };

    return {
      ...event, // No need for .toObject() since it's already a plain object
      ...ratingInfo,
      ...engagementInfo,
      blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType),
      isWishlisted: wishListEventIds.has(id),
    };
  });

  // 🔽 Sort by subscription tier first, then by creation date
  const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data, meta };
};




const getUnsubscriptionEventByLocation = async (
  userId: string,
  query: Record<string, any>,
  userLocation: { latitude: number; longitude: number }
) => {
    query['isDeleted'] = false;

  let data: any[] = [];
  let meta = {};

  if (userLocation) {
    // Use aggregation to sort by nearest first
    const { latitude, longitude } = userLocation;

    const aggregateQuery = Event.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          spherical: true,
          query: { 
            isSubscription: false, 
            isDeleted: false, 
            isActive: true, 
            // author: { $ne: new mongoose.Types.ObjectId(userId) } 
          },
        },
      },
      // Apply QueryBuilder filters manually here if needed
    ]);



    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    data = await aggregateQuery.skip(skip).limit(limit);

    // Count total
    const total = await Event.countDocuments({ isSubscription: false, isDeleted: false, isActive: true });
    meta = {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    };
  } else {
    // Use your original QueryBuilder for normal subscription events
    const baseQuery = Event.find({ isSubscription: true });
    const eventModel = new QueryBuilder(baseQuery, query)
      .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
      .filter()
      .paginate()
      .sort()
      .fields();

    data = await eventModel.modelQuery;
    meta = await eventModel.countTotal();
  }

  if (!data || data.length === 0) return { data, meta };

  const eventIds = data.map((event) => event._id);

  // ⭐ Ratings
  const ratings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: "$eventId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ Engagement
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select("eventId likes comments");

  const engagementMap: Record<
    string,
    { totalLikes: number; totalComments: number; isLiked: boolean }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      acc += 1;
      if ((comment as any).replies && Array.isArray((comment as any).replies)) acc += (comment as any).replies.length;
      return acc;
    }, 0);

    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: totalCommentsWithReplies,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };
  });

  // ⭐ Wishlist
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListEventIds = new Set<string>();
  if (wishList?.folders?.length) {
    wishList.folders.forEach((folder) => {
      folder.events?.forEach((eid) => wishListEventIds.add(eid.toString()));
    });
  }

  // 🔀 Merge data
  data = data.map((event) => {
    const id = event._id.toString();
    return {
      ...event,
      ...ratingMap[id],
      ...engagementMap[id],
      isWishlisted: wishListEventIds.has(id),
    };
  });

  return { data, meta };
};

const getUnsubscriptionEvent = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;

  const eventModel = new QueryBuilder(Event.find({isActive: true, isDeleted: false}), query)
    .search(['name', 'email', 'phoneNumber', 'address'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await eventModel.modelQuery;
  const meta = await eventModel.countTotal();


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
      totalComments: 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };


    // ⭐ Calculate total comments including replies
    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      // Count the comment itself
      acc += 1;

      // Count the replies for this comment
      if ((comment as any).replies && Array.isArray((comment as any).replies)) {
        acc += (comment as any).replies.length;
      }

      return acc;
    }, 0);

    // Update totalComments to include both comments and replies
    engagementMap[id].totalComments = totalCommentsWithReplies;
  });

    // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListEventIds = new Set<string>();

  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.events?.length) {
        folder.events.forEach((eid) => wishListEventIds.add(eid.toString()));
      }
    });
  }

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
      isWishlisted: wishListEventIds.has(id), // ✅ true if in wishlist, else false
    };
  }) as any;

  return { data, meta };
};

const searchEvents = async (
  query: Record<string, any>,
  userId?: string
) => {
  const searchTerm = (query.searchTerm as string) || '';

  console.log("search term=====>>>>> ",searchTerm)

  // 🔎 বেস ফিল্টার (ডিলিটেড বাদ + অ্যাকটিভ)
  const baseFilter: any = {
    isDeleted: false,
    isActive: true,
  };

  // 🔎 টেক্সট সার্চ ফিল্ডগুলো
  if (searchTerm) {
    baseFilter.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { detailDescription: { $regex: searchTerm, $options: 'i' } },
      { address: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
      { type: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phoneNumber: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  // 🧭 QueryBuilder (filter/sort/paginate/fields)
  const baseQuery = Event.find(baseFilter);
  const qb = new QueryBuilder<IEvent>(baseQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  let data = await qb.modelQuery;
  const meta = await qb.countTotal();

  // console.log({data,meta})

  if (!data || data.length === 0) return { data, meta };

  const eventIds = data.map((e) => (e as any)._id);

  // ⭐ রেটিং (avg + count)
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

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ এনগেজমেন্ট (লাইক, কমেন্ট+রিপ্লাই, isLiked)
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select('eventId likes comments');

  const engagementMap: Record<
    string,
    { totalLikes: number; totalComments: number; isLiked: boolean }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    const totalCommentsWithReplies = (stat.comments || []).reduce((acc: number, c: any) => {
      acc += 1; // main comment
      if (Array.isArray(c?.replies)) acc += c.replies.length; // replies
      return acc;
    }, 0);

    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: totalCommentsWithReplies,
      isLiked: userId ? stat.likes?.some((l: any) => l.toString() === userId) : false,
    };
  });

  // ⭐ ইউজারের উইশলিস্ট
  const wishList = userId ? await WishList.findOne({ userId }).lean() : null;
  const wishListEventIds = new Set<string>();
  if (wishList?.folders?.length) {
    wishList.folders.forEach((f: any) => {
      f.events?.forEach((eid: any) => wishListEventIds.add(eid.toString()));
    });
  }

  // 🔀 ফাইনাল মার্জ
  let enriched = data.map((event) => {
    const id = (event as any)._id.toString();

    const rating = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagement =
      engagementMap[id] || { totalLikes: 0, totalComments: 0, isLiked: false };

    return {
      ...(event as any).toObject(),
      ...rating,
      ...engagement,
      blueVerifiedBadge: event.subBlueVerifiedBadge,
      isWishlisted: wishListEventIds.has(id),
      type: 'event',
    };
  });

  // ⬆️ অর্ডারিং: Subscription আগে → টিয়ার → Priority → Newest
  const subscriptionOrder = ['diamond', 'emerald', 'ruby', 'custom', 'none'];
  enriched = enriched.sort((a: any, b: any) => {
    // 1) subscription ইভেন্ট আগে
    if (a.isSubscription !== b.isSubscription) return a.isSubscription ? -1 : 1;

    // 2) টিয়ার অর্ডার
    const pa = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const pb = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');
    if (pa !== pb) return pa - pb;

    // 3) priority level (বড়টা আগে)
    const prA = a.subsciptionPriorityLevel ?? 0;
    const prB = b.subsciptionPriorityLevel ?? 0;
    if (prA !== prB) return prB - prA;

    // 4) newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  console.log("search events =>>> ", enriched)

    // 8️⃣ Store search record with the constructed search term
    // await SearchRecord.create({
    //   address,
    //   city,
    //   town,
    //   keyword: searchTerm, // Set the search term (keyword)
    //   totalResults: results.length,
    //   userId,
    //   type: "Wizard",
    //   searchDate: new Date(),
    // });
    
  return { data: enriched, meta };
};


// 📌 Search Events by Location (always requires lat/lng)
const searchEventsByLocation = async (
  userId: string,
  userLocation: { latitude: number; longitude: number },
  maxDistanceInMeters: number = 50000, // Default 50 km
  query: Record<string, any>,
) => {
  const searchTerm = (query.searchTerm as string) || "";

  // 🌍 Geo-location query with distance filter (50 km = 50,000 meters)
  const { latitude, longitude } = userLocation;
  const aggregateQuery = Event.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distance",
        spherical: true,
        maxDistance: maxDistanceInMeters, // ✅ within 50km
        query: {
          isDeleted: false,
          isActive: true,
          ...(searchTerm && {
            $or: [
              { name: { $regex: searchTerm, $options: "i" } },
              { description: { $regex: searchTerm, $options: "i" } },
              { detailDescription: { $regex: searchTerm, $options: "i" } },
              { address: { $regex: searchTerm, $options: "i" } },
              { category: { $regex: searchTerm, $options: "i" } },
              { type: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
              { phoneNumber: { $regex: searchTerm, $options: "i" } },
            ],
          }),
        },
      },
    },
  ]);

  // Pagination
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  let data = await aggregateQuery.skip(skip).limit(limit);

  const total = await Event.countDocuments({
    isDeleted: false,
    isActive: true,
  });

  const meta = {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };

  if (!data || data.length === 0) return { data, meta };

  // ⭐ Ratings
  const eventIds = data.map((e) => (e as any)._id);
  const ratings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: "$eventId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ Engagement
  const engagementStats = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select("eventId likes comments");

  const engagementMap: Record<string, { totalLikes: number; totalComments: number; isLiked: boolean }> = {};
  engagementStats.forEach((stat) => {
    const id = stat.eventId.toString();
    const totalCommentsWithReplies = (stat.comments || []).reduce((acc: number, c: any) => {
      acc += 1;
      if (Array.isArray(c?.replies)) acc += c.replies.length;
      return acc;
    }, 0);

    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: totalCommentsWithReplies,
      isLiked: userId ? stat.likes?.some((l: any) => l.toString() === userId) : false,
    };
  });

  // ⭐ Wishlist
  const wishList = userId ? await WishList.findOne({ userId }).lean() : null;
  const wishListEventIds = new Set<string>();
  if (wishList?.folders?.length) {
    wishList.folders.forEach((f: any) => {
      f.events?.forEach((eid: any) => wishListEventIds.add(eid.toString()));
    });
  }

  // 🔀 Merge results
  let enriched = data.map((event) => {
    const id = (event as any)._id.toString();

    const rating = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagement = engagementMap[id] || { totalLikes: 0, totalComments: 0, isLiked: false };

    return {
      ...(event as any).toObject?.() ?? event,
      ...rating,
      ...engagement,
      blueVerifiedBadge: event.subBlueVerifiedBadge,
      isWishlisted: wishListEventIds.has(id),
      type: "event",
    };
  });

  // ⬆️ Sorting
  const subscriptionOrder = ["diamond", "emerald", "ruby", "custom", "none"];
  enriched = enriched.sort((a: any, b: any) => {
    if (a.isSubscription !== b.isSubscription) return a.isSubscription ? -1 : 1;
    const pa = subscriptionOrder.indexOf(a.subscriptionType ?? "none");
    const pb = subscriptionOrder.indexOf(b.subscriptionType ?? "none");
    if (pa !== pb) return pa - pb;
    const prA = a.subsciptionPriorityLevel ?? 0;
    const prB = b.subsciptionPriorityLevel ?? 0;
    if (prA !== prB) return prB - prA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data: enriched, meta };
};



// const getEventById = async (id: string) => {
//   const result = await Event.findById(id);
//   if (!result || result.isDeleted) throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
//   return result;
// };

const getEventById = async (userId: string, id: string) => {
  const event = await Event.findById(id);

  if (!event || event.isDeleted) {
    // throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
    return null;
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

    // ⭐ Get Engagement Stats (likes/comments)
  const engagement = await EventEngagementStats.findOne({ eventId })
    .select('likes comments');

  // Calculate total comments, including replies
  const totalCommentsWithReplies = engagement?.comments.reduce((acc, comment) => {
    // Count the comment itself
    acc += 1;

    // Count the replies for this comment
    if ((comment as any).replies && Array.isArray((comment as any).replies)) {
      acc += (comment as any).replies.length;
    }

    return acc;
  }, 0) || 0;

  const engagementInfo = {
    totalLikes: engagement?.likes?.length || 0,
    totalComments: totalCommentsWithReplies,
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
    return []
    // throw new AppError(httpStatus.NOT_FOUND, 'No events found for this user');
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

      // Calculate total comments, including replies
      const totalCommentsWithReplies = engagement?.comments.reduce((acc, comment) => {
        // Count the comment itself
        acc += 1;

        // Count the replies for this comment
        if ((comment as any).replies && Array.isArray((comment as any).replies)) {
          acc += (comment as any).replies.length;
        }

        return acc;
      }, 0) || 0;

      const engagementInfo = {
        totalLikes: engagement?.likes?.length || 0,
        totalComments: totalCommentsWithReplies,
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
  const event = await Event.findOne({ _id: id, isDeleted: false }).select("logo author subscriptionStatus expireSubscriptionTime").lean();
  if (!event) {
    throw new Error('event not found');
  }

  const authorId = event.author;
    // ⭐ Get totalCredits of the author
  const author = await User.findById(authorId).select('totalCredits customId').lean();
  const totalCredits = author?.totalCredits || 0;
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
  const activeSubscriptions = event.subscriptionList?.filter(
    (sub) => sub.expireDate && new Date((sub as any).expireDate) > now
  ) || [];

  const activeSubscription = activeSubscriptions[0] || null;
  const totalActiveSub = event.subscriptionStatus === 'activated' ? 1 : 0;
  const subscriptionEndTime = event.expireSubscriptionTime;


    // 3️⃣ Get profile views & monthly breakdown
  const interestsDoc = await EventInterestUserList.findOne({ eventId: id }).lean();
  const interestsUsers = interestsDoc?.interestUsers.length || 0;

  // ✅ Final return object
  return {
    eventId,
    image: event.logo,
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
    interestsUsers,
    totalCredits,
    subscriptionEndTime
  };
};

const getMyEventList = async (userId: string) => {
  console.log({userId})
  const events = await Event.find({ author: userId, isDeleted: false }).select("name");

  if (!events.length) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No events found for this user');
    return [];
  }
  
  return events;
  
};

const updateEvent = async (
  eventId: string,
  updateData: Partial<IEvent> & { deleteGallery?: string[] }
) => {
  // Fetch the existing event
  const existingEvent = await Event.findById(eventId);
  if (!existingEvent) {
    throw new Error("Event not found");
  }

  let newGallery = existingEvent.gallery || [];

  // Remove images if deleteGallery is provided
  if (updateData.deleteGallery && updateData.deleteGallery.length > 0) {
    newGallery = newGallery.filter(
      img => !(updateData.deleteGallery as any)!.includes(img)
    );
  }

  // Append new images if provided
  if (updateData.gallery && updateData.gallery.length > 0) {
    newGallery = [...newGallery, ...updateData.gallery];
  }

  // Update the gallery in updateData
  updateData.gallery = newGallery;

  // Remove deleteGallery from updateData to avoid saving it in DB
  delete updateData.deleteGallery;

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { ...updateData },
    { new: true }
  );

  return updatedEvent;
};



const activateEventById = async (
  userId: string,
  eventId: string
) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new Error('event not found');
  }

  // Check if the user is the author (ObjectId to string comparison)
  if (event.author.toString() !== userId) {
    throw new Error('You are not allowed to update this event');
  }

  // Toggle isActive value
  const updatedevent = await Event.findByIdAndUpdate(
    eventId,
    { isActive: !event.isActive },
    { new: true }
  );

  return updatedevent;
};

const getExtraEventDataById = async (
  eventId: string,
  userId: string
) => {
  // 1. Fetch main event with author
  const existingEvent = await Event.findById(eventId).populate("author", "name sureName");
console.log({existingEvent})
  if (!existingEvent || existingEvent.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Event not found');
  }

  const now = new Date();

  // 2. Fetch comments (engagement)
const commentStats = await EventEngagementStats.findOne({ eventId })
    .select('comments')
    .populate('comments.user', 'name profileImage')  // Populate user details for the comment
    .populate('comments.replies.user', 'name profileImage') // Populate user details for each reply
    || { comments: [] };

  console.log({commentStats})

  // 3. Fetch all events from the same author (excluding deleted ones)
  const authorEvents = await Event.find({
    author: (existingEvent.author as any)._id,
    isDeleted: false,
  });

  console.log({authorEvents})

  const currentRaw = authorEvents.filter((e) => e._id.toString() !== eventId && (e as any).startDate < now);
  console.log({currentRaw})
  const currentEvents = await Promise.all(currentRaw.map((event) => enrichEvent(event, userId))) || [];

  // 4. Related events (same category, different author)
  const relatedRaw = await Event.find({
    _id: { $ne: eventId },
    author: { $ne: userId },
    category: existingEvent.category,
    isDeleted: false,
  })
    .limit(5)
    .select('name coverImage startDate endDate startTime endTime location category author');

  const relatedEvents = await Promise.all(
    relatedRaw.map(async (e) => {
      const enriched = await enrichEvent(e, userId);
      return enriched;
    })
  ) || [];

    // 5. Check if the user is already interested in the event
  const eventInterest = await EventInterestUserList.findOne({ eventId }).select('interestUsers');
  const isInterested = eventInterest?.interestUsers.some((interest) => interest.user.toString() === userId) || false;


  // 🧃 Final return
  return {
    author: {
      name: (existingEvent.author as any)?.name || '',
      surename: (existingEvent.author as any)?.sureName || '',
    },
    comments: commentStats.comments || [],
    currentEvents,
    relatedEvents,
    isInterested,
  };
};


const calculateCompetitionScoreForEvent = async (eventId: string) => {
  // Step 1: Get the event
  const event = await Event.findById(eventId).select('location category subscriptionType isDeleted').lean();

  if (!event || !event.location || !event.category) {
    throw new Error('Event must have location and category to calculate competition.');
  }

  const [longitude, latitude] = event.location.coordinates;

  // Step 2: Find nearby competing events
  const radiusInKm = 50;
  const competingEvents = await Event.find({
    _id: { $ne: eventId },
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInKm * 1000, // convert to meters
      },
    },
    category: event.category,
    isDeleted: false,
    isActive: true,
  }).select('subscriptionType');

  // Step 3: Subscription weight mapping
  const weights = {
    diamond: 5,
    emerald: 3,
    ruby: 2,
    none: 0.5,
  };

  let D = 0, E = 0, R = 0, N = 0;
  for (const e of competingEvents) {
    switch (e.subscriptionType) {
      case 'diamond':
        D++;
        break;
      case 'emerald':
        E++;
        break;
      case 'ruby':
        R++;
        break;
      default:
        N++;
    }
  }

  const TOTAL = D + E + R + N;
  const numerator = (D * weights.diamond) + (E * weights.emerald) + (R * weights.ruby) + (N * weights.none);
  const denominator = TOTAL * 4.5 || 1;
  const rawScore = (numerator / denominator) * 100;
  const roundedScore = Math.round(rawScore);

  // Step 4: Suggest a pack based on competition level
  let suggestedPack: CompetitionResultOfEvent['suggestedPack'] = 'RUBY';
  if (roundedScore > 60) {
    suggestedPack = 'DIAMOND';
  } else if (roundedScore > 30) {
    suggestedPack = 'EMERALD';
  }

  const plusActive = roundedScore >= 80;

  return {
    competitionScore: roundedScore,
    suggestedPack,
    plusActive,
  };
};

const getAllCategoryAndEventName = async() => {
   // Fetch all categories with only the name
    const categories = await Category.find(
      { type: "Event", isDeleted: false },
      'name'  // Only select the 'name' field for categories
    );

    // Fetch all businesses with their name and category
    const events = await Event.find({isDeleted: false}, 'name');  // Adjust the field if needed

   // Combine categories and businesses into a single array
    const combinedData = [
      ...categories.map((category) => ({ type: 'category', name: category.name })),
      ...events.map((event) => ({ type: 'event', name: event.name }))
    ];

    return combinedData;
}

const deleteEvent = async (id: string) => {
  const result = await Event.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete event');
  return result;
};

export const eventService = {
  createEvent,
  getAllEvents,
  searchEvents,
  getSubscrptionEvent,
  getUnsubscriptionEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getExtraEventDataById,
  getMyEventList,
  getSpecificEventStats,
  getEventList,
  activateEventById,
  calculateCompetitionScoreForEvent,
  getAllCategoryAndEventName,
  getEventsByLocation,
  getUnsubscriptionEventByLocation,
  getSubscrptionEventByLocation,
  searchEventsByLocation
};
