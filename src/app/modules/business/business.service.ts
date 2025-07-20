import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { buildLocation } from '../../utils/buildLocation';
import { IBusiness } from './business.interface';
import Business from './business.model';
import { User } from '../user/user.models';
import { console } from 'inspector';
import BusinessReview from '../businessReview/businessReview.model';
import BusinessEngagementStats from '../businessEngaagementStats/businessEngaagementStats.model';
import BusinessProfileViews from '../businessProfileViews/businessProfileViews.model';
import Event from '../event/event.model';
import Category from '../category/category.model';
import SearchRecord from '../searchRecord/searchRecord.model';
import { enrichEvent } from '../event/event.utils';
import { Inspiration } from '../inspiration/inspiration.model';
import { Types } from 'mongoose';
import { monthNames } from './business.utils';

const createBusiness = async (payload: IBusiness) => {
  const { longitude, latitude, ...rest } = payload;
  // Build location if coordinates are provided
  if (longitude !== undefined && latitude !== undefined) {
    rest.location = buildLocation(longitude, latitude) as any;
  }

  const isExistBusiness = await Business.findOne({author: payload.author});

  if(isExistBusiness){
    rest.businessLevel = 'sub';
  }


  const result = await Business.create(rest);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create business');
  }

  if(isExistBusiness){
    await User.findByIdAndUpdate(payload.author, {isSubBusiness: true}, {new: true})
    }
  else{
    await User.findByIdAndUpdate(payload.author, {parentBusiness: result._id}, {new: true})
  }

  return result;
};

// const getAllBusiness = async (query: Record<string, any>) => {
//   query['isDeleted'] = false;
//   const businessModel = new QueryBuilder(Business.find(), query)
//     .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
//     .filter()
//     .paginate()
//     .sort()
//     .fields();

//   const data = await businessModel.modelQuery;
//   const meta = await businessModel.countTotal();

//   return {
//     data,
//     meta,
//   };
// };



const getAllBusiness = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false; 


  const baseQuery = Business.find().populate('providerType','name').select(
    'name coverImage address priceRange maxGuest subscriptionType createdAt providerType'
  );

  const businessModel = new QueryBuilder(baseQuery, query)
    .search(['name', 'email', 'phoneNumber', 'address', 'subscriptionType ', 'priceRange'])
    .filter()
    .paginate()
    .fields();

  let data = await businessModel.modelQuery;
  const meta = await businessModel.countTotal();

  if (!data || data.length === 0) return { data, meta };

  const businessIds = data.map((biz) => biz._id);

  // ⭐ Aggregate reviews
  const ratings = await BusinessReview.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: '$businessId',
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

  // ⭐ Get engagement stats (likes/comments)
  const engagementStats = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments');

  // const engagementMap: Record<
  //   string,
  //   { totalLikes: number; totalComments: number; }
  // > = {};
  
  // engagementStats.forEach((stat) => {
  //   engagementMap[stat.businessId.toString()] = {
  //     totalLikes: stat.likes?.length || 0,
  //     totalComments: stat.comments?.length || 0,
  //   };
  // });

    const engagementMap: Record<
    string,
    {
      totalLikes: number;
      totalComments: number;
      isLiked: boolean;
      isFollowed: boolean;
    }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.businessId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };
  });

  // 🔀 Merge all data together
  data = data.map((biz) => {
    const id = biz._id.toString();

    const ratingInfo = ratingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    const engagementInfo = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
      isFollowed: false,
    };

    return {
      ...biz.toObject(),
      ...ratingInfo,
      ...engagementInfo,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
    };
  });

  // 🔽 Sort: subscriptionType then newest
  const subscriptionOrder = ['exclusive', 'elite', 'prime', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data, meta };
};


const getSpecificCategoryBusiness = async (
  categoryId: string,
  userId: string,
  query: Record<string, any>
) => {
  query['isDeleted'] = false;
  query['providerType'] = categoryId;

  const baseQuery = Business.find()
    .populate('providerType', 'name')
    .select(
      'name coverImage address priceRange maxGuest subscriptionType createdAt providerType'
    );

  const businessModel = new QueryBuilder(baseQuery, query)
    .search(['name', 'email', 'phoneNumber', 'address', 'subscriptionType', 'priceRange'])
    .filter()
    .paginate()
    .fields();

  let data = await businessModel.modelQuery;
  const meta = await businessModel.countTotal();

  if (!data || data.length === 0) return { data, meta };

  const businessIds = data.map((biz) => biz._id);

  // ⭐ Get Ratings
  const ratings = await BusinessReview.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: '$businessId',
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

  // ⭐ Engagement Stats
  const engagementStats = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments followers');

  const engagementMap: Record<
    string,
    {
      totalLikes: number;
      totalComments: number;
      isLiked: boolean;
      isFollowed: boolean;
    }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.businessId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };
  });

  // 🔀 Merge All
  data = data.map((biz) => {
    const id = biz._id.toString();

    const ratingInfo = ratingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    const engagementInfo = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
      isFollowed: false,
    };

    return {
      ...biz.toObject(),
      ...ratingInfo,
      ...engagementInfo,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
    };
  });

  // 🔽 Sort By Subscription Type then Newest
  const subscriptionOrder = ['exclusive', 'elite', 'prime', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return { data, meta };
};



const getSubscrptionBusiness = async (query: Record<string, any>) => {
  query['isDeleted'] = false;

  const businessModel = new QueryBuilder(Business.find(), query)
    .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
    .filter()
    .paginate()
    .fields();

  let data = await businessModel.modelQuery;
  const meta = await businessModel.countTotal();

  if (!data || data.length === 0) return { data, meta };




  const subscriptionOrder = ['exclusive', 'elite', 'prime', 'none'];

  data = data.sort((a, b) => {
    const indexA = subscriptionOrder.indexOf(a.subscriptionType ?? '');
    const indexB = subscriptionOrder.indexOf(b.subscriptionType ?? '');

    const posA = indexA === -1 ? subscriptionOrder.length : indexA;
    const posB = indexB === -1 ? subscriptionOrder.length : indexB;

    if (posA !== posB) {
      return posA - posB;
    }

    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    return dateB - dateA; // newest first
  });

  return { data, meta };
};

const getUnsubscriptionBusiness = async (query: Record<string, any>) => {
  query['isDeleted'] = false;
  query['isSubscription'] = false; // Only unsubscription businesses

  console.log({query})


  const businessModel = new QueryBuilder(Business.find(), query)
    .search(['name', 'email', 'phoneNumber', 'address', 'priceRange'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await businessModel.modelQuery;
  const meta = await businessModel.countTotal();

  return { data, meta };
};

const getBusinessById = async (userId:string, id: string) => {
  const business = await Business.findById(id)
    .populate('providerType', 'name')
    // .select('name coverImage address priceRange maxGuest subscriptionType createdAt providerType isDeleted');

  if (!business || business.isDeleted) {
    throw new Error('Business not found!');
  }

  const businessId = business._id;

  BusinessProfileViews.findOneAndUpdate(
    { businessId: businessId },
    {
      $push: {
        viewUsers: {
          user: userId,
          viewedAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  ).exec()

  // ⭐ Get rating
  const ratingAgg = await BusinessReview.aggregate([
    { $match: { businessId: businessId } },
    {
      $group: {
        _id: '$businessId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const rating = ratingAgg[0] || {
    averageRating: 0,
    totalReviews: 0,
  };

  // ⭐ Get engagement
  const engagement = await BusinessEngagementStats.findOne({
    businessId: businessId,
  })
  .select('followers likes comments');

  const engagementInfo = {
    totalFollowers: engagement?.followers?.length || 0,
    totalLikes: engagement?.likes?.length || 0,
    totalComments: engagement?.comments?.length || 0,
    isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
    isFollowed: engagement?.followers?.some((u) => u.toString() === userId) || false,
  };

    // ⭐ Get All Reviews (sorted newest first) with user data
  const reviews = await BusinessReview.find({ businessId })
    .populate('userId', 'name profileImage') // 💁‍♂️ Adjust fields as needed
    .select('rating comment')
    .sort({ createdAt: -1 });

  // 👑 Final enriched result
  return {
    ...business.toObject(),
    averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
    totalReviews: rating.totalReviews || 0,
    totalFollowers: engagementInfo.totalFollowers,
    totalLikes: engagementInfo.totalLikes,
    totalComments: engagementInfo.totalComments,
    isLiked: engagementInfo.isLiked,
    isFollowed: engagementInfo.isFollowed,
    blueVerifiedBadge: business.subscriptionType === 'exclusive',
    categoryName: business.providerType?.name || null,
    reviews
  };
};

const getMyBusinesses = async (userId: string) => {
  const businesses = await Business.find({ author: userId, isDeleted: false })
    .populate('providerType', 'name');

  if (!businesses.length) {
    throw new Error('No businesses found!');
  }

  const results = await Promise.all(
    businesses.map(async (business) => {
      const businessId = business._id;

      // 🔄 Update profile views (background)
      BusinessProfileViews.findOneAndUpdate(
        { businessId },
        {
          $push: {
            viewUsers: {
              user: userId,
              viewedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      ).exec();

      // ⭐ Get rating
      const ratingAgg = await BusinessReview.aggregate([
        { $match: { businessId } },
        {
          $group: {
            _id: '$businessId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);
      const rating = ratingAgg[0] || {
        averageRating: 0,
        totalReviews: 0,
      };

      // ⭐ Get engagement
      const engagement = await BusinessEngagementStats.findOne({ businessId })
        .select('followers likes comments');
      const engagementInfo = {
        totalFollowers: engagement?.followers?.length || 0,
        totalLikes: engagement?.likes?.length || 0,
        totalComments: engagement?.comments?.length || 0,
        isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
        isFollowed: engagement?.followers?.some((u) => u.toString() === userId) || false,
      };

      // ⭐ Get reviews
      const reviews = await BusinessReview.find({ businessId })
        .populate('userId', 'name profileImage')
        .select('rating comment')
        .sort({ createdAt: -1 });

      // 🔚 Return enriched business object
      return {
        ...business.toObject(),
        averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
        totalReviews: rating.totalReviews || 0,
        totalFollowers: engagementInfo.totalFollowers,
        totalLikes: engagementInfo.totalLikes,
        totalComments: engagementInfo.totalComments,
        isLiked: engagementInfo.isLiked,
        isFollowed: engagementInfo.isFollowed,
        blueVerifiedBadge: business.subscriptionType === 'exclusive',
        categoryName: business.providerType?.name || null,
        reviews,
      };
    })
  );

  return results;
};
const getExtraBusinessDataById = async (userId: string, id: string) => {
  const business = await Business.findById(id)
    .populate('providerType', 'name')
  // .select('name coverImage address priceRange maxGuest subscriptionType createdAt providerType isDeleted');

  if (!business || business.isDeleted) {
    throw new Error('Business not found!');
  }

  const now = new Date();



  
  // ⭐ Get current and past events by author using startDate
  const allEvents = await Event.find({
    author: business.author,
    isDeleted: false,
  });

  const currentRaw = allEvents.filter((e) => e.startDate >= now);
  const pastRaw = allEvents.filter((e) => e.startDate < now);

  const currentEvents = await Promise.all(currentRaw.map((event) => enrichEvent(event, userId))) || [];
  const pastEvents = await Promise.all(pastRaw.map((event) => enrichEvent(event, userId))) || [];

  // ⭐ Get related businesses with same providerType (excluding current)
  const relatedRaw = await Business.find({
    _id: { $ne: business._id },
    author: {$ne: userId},
    providerType: business.providerType || null,
    isDeleted: false,
  })
    .limit(5)
    .select('name coverImage address priceRange subscriptionType maxGuest');
  
  const stats = await BusinessEngagementStats.findOne({ businessId: id })
    .select('comments') // only select comments
    .populate('comments.user', 'name profileImage') || [];
  
      // ⭐ Fetch inspiration blogs
  const inspirationBlogs = await Inspiration.find({
    author: business.author,
    type: 'blog',
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title coverImage description category createdAt') || [];
  
  // ⭐ Add averageRating and totalReviews to each related business
  const relatedBusinesses = await Promise.all(
    relatedRaw.map(async (b) => {
      const ratingAgg = await BusinessReview.aggregate([
        { $match: { businessId: b._id } },
        {
          $group: {
            _id: '$businessId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      const rating = ratingAgg[0] || { averageRating: 0, totalReviews: 0 };

        // ⭐ Get engagement
  const engagement = await BusinessEngagementStats.findOne({
    businessId: id,
  })
  .select('followers likes comments');

  const engagementInfo = {
    totalFollowers: engagement?.followers?.length || 0,
    totalLikes: engagement?.likes?.length || 0,
    totalComments: engagement?.comments?.length || 0,
    isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
    isFollowed: engagement?.followers?.some((u) => u.toString() === userId) || false,
  };

      return {
        ...b.toObject(),
        totalFollowers: engagementInfo.totalFollowers,
    totalLikes: engagementInfo.totalLikes,
    totalComments: engagementInfo.totalComments,
    isLiked: engagementInfo.isLiked,
    isFollowed: engagementInfo.isFollowed,
    blueVerifiedBadge: business.subscriptionType === 'exclusive',
        averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
        totalReviews: rating.totalReviews || 0,
      };
    })
  ) || [];



  // 👑 Final enriched result
  return {
    currentEvents,
    pastEvents,
    inspirationBlogs,
    comments: stats?.comments || [],
    relatedBusinesses,
  };
};

// const getBusinessById = async (id: string) => {
//   const result = await Business.findById(id);
//   if (!result || result?.isDeleted) {
//     throw new Error('Business not found!');
//   }
//   return result;
// };



const getSpecificBusinessStats = async (businessId: string) => {
  const id = new Types.ObjectId(businessId);

  // 1️⃣ Check business existence and status
  const business = await Business.findOne({ _id: id, isDeleted: false }).lean();
  if (!business) {
    throw new Error('Business not found');
  }

  const authorId = business.author;

  // ⭐ Get totalCredits of the author
  const author = await User.findById(authorId).select('totalCredits').lean();
  const totalCredits = author?.totalCredits || 0;

  // 2️⃣ Get engagement stats (followers, likes, comments)
  const engagement = await BusinessEngagementStats.findOne({ businessId: id }).lean();
  const totalFollowers = engagement?.followers?.length || 0;
  const totalLikes = engagement?.likes?.length || 0;
  const totalComments = engagement?.comments?.length || 0;

  // 3️⃣ Get profile views & monthly breakdown
  const viewsDoc = await BusinessProfileViews.findOne({ businessId: id }).lean();
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
  const ratingAgg = await BusinessReview.aggregate([
    { $match: { businessId: id } },
    {
      $group: {
        _id: '$businessId',
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
  const activeSubscriptions = business.subcriptionList?.filter(
    (sub) => sub.expireDate && new Date(sub.expireDate) > now
  ) || [];

  const activeSubscription = activeSubscriptions[0] || null;
  const totalActiveSub = activeSubscriptions.length;

  // ✅ Final return object
  return {
    businessId,
    totalFollowers,
    totalLikes,
    totalComments,
    profileViews,
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
    totalCredits
  };
};


const updateBusiness = async (
  businessId: string,
  updateData: Partial<IBusiness>
) => {
  const updatedBusiness = await Business.findByIdAndUpdate(
    businessId,
    updateData,
    { new: true }
  );

  return updatedBusiness;
};

const deleteBusiness = async (id: string) => {
  const result = await Business.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete business');
  }
  return result;
};

const getBusinessAndEventsForMap = async (userId?: string) => {
  const today = new Date();
  // 🔍 Fetch businesses with required fields
  const businesses = await Business.find({ isDeleted: false })
    .select('name address location coverImage availabilities');

  // 🔍 Fetch events with required fields
  const events = await Event.find({ isDeleted: false, endDate: { $gte: today }})
    .select('name address location coverImage startDate endDate startTime endTime');

  return {
    businesses,
    events,
  };
};

export const searchBusinesses = async (
  query: Record<string, unknown>,
  userId?: string
) => {
  const searchTerm = query.searchTerm as string;

  // Find matching categories by name
  const matchedCategories = await Category.find({
    name: { $regex: searchTerm, $options: 'i' },
    isDeleted: false,
  });

  const matchedCategoryIds = matchedCategories.map((cat) => cat._id);

  // Create base query
  const baseQuery = Business.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      ...(matchedCategoryIds.length
        ? [{ providerType: { $in: matchedCategoryIds } }]
        : []),
    ],
    isDeleted: false,
  }).populate('providerType');

  // Use QueryBuilder
  const queryBuilder = new QueryBuilder<IBusiness>(baseQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  // Store search record
  await SearchRecord.create({
    keyword: searchTerm,
    totalResults: data.length,
    userId,
    searchDate: new Date(),
  });

  return { data, meta };
};

export const businessService = {
  createBusiness,
  getSubscrptionBusiness,
  getUnsubscriptionBusiness,
  getAllBusiness,
  getSpecificCategoryBusiness,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessAndEventsForMap,
  getMyBusinesses,
  searchBusinesses,
  getExtraBusinessDataById,
  getSpecificBusinessStats
};
