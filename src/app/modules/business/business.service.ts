import httpStatus from 'http-status';
import mongoose, { Types } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/AppError';
import { buildLocation } from '../../utils/buildLocation';
import BusinessEngagementStats from '../businessEngaagementStats/businessEngaagementStats.model';
import BusinessProfileViews from '../businessProfileViews/businessProfileViews.model';
import BusinessReview from '../businessReview/businessReview.model';
import Category from '../category/category.model';
import Event from '../event/event.model';
import { enrichEvent } from '../event/event.utils';
import { Inspiration } from '../inspiration/inspiration.model';
import SearchRecord from '../searchRecord/searchRecord.model';
import { User } from '../user/user.models';
import { CompetitionResult, IBusiness, WizardFilters } from './business.interface';
import Business from './business.model';
import { monthNames } from './business.utils';
import WishList from '../wishlist/wishlist.model';

const createBusiness = async (payload: IBusiness) => {
  const { longitude, latitude, ...rest } = payload;
  // Build location if coordinates are provided
  if (longitude !== undefined && latitude !== undefined) {
    rest.location = buildLocation(longitude, latitude) as any;
  }

  const isExistBusiness = await Business.findOne({ author: payload.author });

  if (isExistBusiness) {
    rest.businessLevel = 'sub';
  }


  const result = await Business.create(rest);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create business');
  }

  if (isExistBusiness) {
    await User.findByIdAndUpdate(payload.author, { isSubBusiness: true }, { new: true })
  }
  else {
    await User.findByIdAndUpdate(payload.author, { parentBusiness: result._id }, { new: true })
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

const getAllBusinessByLocation = async (userId: string, query: Record<string, any>, userLocation: { latitude: number, longitude: number }, maxDistance: number = 5000) => {
  query['isActive'] = true;
  query['isDeleted'] = false;

  const { latitude, longitude } = userLocation;

  // Aggregate query to include $geoNear for geospatial sorting by distance
  const aggregateQuery = Business.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude], // [longitude, latitude]
        },
        distanceField: 'distance', // Add a field to store the distance from the point
        maxDistance: maxDistance, // Max distance in meters
        spherical: true, // Use spherical coordinates for accurate distance calculation
      },
    },
    {
      $match: {
        author: { $ne: new mongoose.Types.ObjectId(userId) },
        isActive: true,
        isDeleted: false,
      },
    },
    {
      $sort: { distance: 1 }, // Sort by distance, ascending (nearest businesses first)
    },
    {
      $project: {
        name: 1,
        coverImage: 1,
        address: 1,
        priceRange: 1,
        maxGuest: 1,
        subscriptionType: 1,
        createdAt: 1,
        providerType: 1,
        location: 1,
        distance: 1, // Include the calculated distance
      },
    },
  ]);

  // Pagination logic after aggregation
  const page = parseInt(query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(query.limit) || 10; // Default to 10 items per page
  const skip = (page - 1) * limit;

  // Paginate the results from the aggregation
  const paginatedData = aggregateQuery.skip(skip).limit(limit);

  let data = await paginatedData;
  const meta = {
    total: await Business.countDocuments({
      author: { $ne: new mongoose.Types.ObjectId(userId) },
      isActive: true,
      isDeleted: false,
    }),
    page,
    limit,
  };

  // Handle case where no business is found within the location
  if (!data || data.length === 0) {
    return { data: [], meta, message: 'No businesses found near your location.' };
  }

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
      totalComments: 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };

    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      acc += 1;
      if (comment.replies && Array.isArray(comment.replies)) {
        acc += comment.replies.length;
      }
      return acc;
    }, 0);

    engagementMap[id].totalComments = totalCommentsWithReplies;
  });

  // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListBusinessIds = new Set<string>();

  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.businesses?.length) {
        folder.businesses.forEach((eid) => wishListBusinessIds.add(eid.toString()));
      }
    });
  }

  // 🔀 Merge into final response
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
      ...biz, // No need to use .toObject() as `biz` is already a plain object
      ...ratingInfo,
      ...engagementInfo,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
      isWishlisted: wishListBusinessIds.has(id), // ✅ true if in wishlist, else false
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



const getAllBusiness = async (userId: string, query: Record<string, any>) => {
  query['isActive'] = true;
  query['isDeleted'] = false;


  const baseQuery = Business.find({author: { $ne: new mongoose.Types.ObjectId(userId) },isActive: true, isDeleted: false}).populate('providerType', 'name').select(
    'name coverImage address priceRange maxGuest subscriptionType createdAt providerType'
  );

  const businessModel = new QueryBuilder(baseQuery, query)
    .search(['name', 'email', 'phoneNumber', 'address', 'subscriptionType ', 'priceRange'])
    .filter()
    .paginate()
    .fields()
    .sort();

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
      totalComments:0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };

        // Counting total comments including replies
    const totalCommentsWithReplies = stat.comments.reduce((acc, comment) => {
      // Count the comment itself
      acc += 1;

      // Count the replies to this comment
      if (comment.replies && Array.isArray(comment.replies)) {
        acc += comment.replies.length;
      }

      return acc;
    }, 0);

    engagementMap[id].totalComments = totalCommentsWithReplies;
  
  });

    // ⭐ Fetch user wishlist events
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListBusinessIds = new Set<string>();

  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.businesses?.length) {
        folder.businesses.forEach((eid) => wishListBusinessIds.add(eid.toString()));
      }
    });
  }

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
      isWishlisted: wishListBusinessIds.has(id), // ✅ true if in wishlist, else false
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

const getBusinessList = async (userId: string) => {
  const businesses = await Business.find({ isDeleted: false })
    .populate('author', 'sureName name email')
    .populate('providerType', 'name')
    // .select('name description detailDescription logo coverImage email phone address priceRange maxGuest subscriptionType createdAt providerType')
    .lean();

  if (!businesses || businesses.length === 0) return [];

  const businessIds = businesses.map((b) => b._id);

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

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // ⭐ Get Engagement Stats
  const engagementStats = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments followers');

  const engagementMap: Record<string, {
    totalFollowers: number,
    totalLikes: number;
    totalComments: number;
    isLiked: boolean;
    isFollowed: boolean;
  }> = {};

  engagementStats.forEach((stat) => {
    const id = stat.businessId.toString();
    engagementMap[id] = {
      totalFollowers: stat.followers.length || 0,
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };
  });

  // 🔀 Combine all
  let result = businesses.map((biz) => {
    const id = biz._id.toString();
    const rating = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagement = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
      isFollowed: false,
    };

    return {
      ...biz,
      ...rating,
      ...engagement,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
    };
  });

  // 🔽 Sort by subscription type then createdAt
  const subscriptionOrder = ['exclusive', 'elite', 'prime', 'none'];
  result = result.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return result;
};

const getBusinessNameList = async (userId: string) => {
   const myBusiness = await Business.find({author: userId, isDeleted: false }).select("name")
   
   return myBusiness || []
};


const getSpecificCategoryBusiness = async (
  categoryId: string,
  userId: string,
  query: Record<string, any>
) => {
  query['isDeleted'] = false;
  query['providerType'] = categoryId;


  console.log("user id -> ", {userId})
  const baseQuery = Business.find({author: { $ne: new mongoose.Types.ObjectId(userId) },isActive: true, isDeleted: false})
    .populate('providerType', 'name')
    .select(
      'name coverImage address priceRange maxGuest subscriptionType createdAt providerType'
  );
  
  console.log({baseQuery})

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

  console.log({ query })


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

const getBusinessById = async (userId: string, id: string) => {
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
    totalComments:  0,
    isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
    isFollowed: engagement?.followers?.some((u) => u.toString() === userId) || false,
  };


  // Count comments and replies
      const totalCommentsWithReplies = engagement?.comments.reduce((acc, comment) => {
        // Count the comment itself
        acc += 1;

        // Count the replies to this comment
        if (comment.replies && Array.isArray(comment.replies)) {
          acc += comment.replies.length;
        }

        return acc;
      }, 0) || 0;

      engagementInfo.totalComments = totalCommentsWithReplies;


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

  // if (!businesses.length) {
  //   throw new Error('No businesses found!');
  // }

  const results = await Promise.all(
    businesses.map(async (business) => {
      const businessId = business._id;

      // // 🔄 Update profile views (background)
      // BusinessProfileViews.findOneAndUpdate(
      //   { businessId },
      //   {
      //     $push: {
      //       viewUsers: {
      //         user: userId,
      //         viewedAt: new Date(),
      //       },
      //     },
      //   },
      //   { upsert: true, new: true }
      // ).exec();

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
        totalComments: 0,
        isLiked: engagement?.likes?.some((u) => u.toString() === userId) || false,
        isFollowed: engagement?.followers?.some((u) => u.toString() === userId) || false,
      };

      // Count comments and replies
      const totalCommentsWithReplies = engagement?.comments.reduce((acc, comment) => {
        // Count the comment itself
        acc += 1;

        // Count the replies to this comment
        if (comment.replies && Array.isArray(comment.replies)) {
          acc += comment.replies.length;
        }

        return acc;
      }, 0) || 0;

      engagementInfo.totalComments = totalCommentsWithReplies;

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

  return results || [];
};

const getMyParentBusiness = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.parentBusiness) {
    throw new Error('This user does not have a parent business assigned');
  }

  const parentBusiness = await Business.findById(user.parentBusiness);

  if (!parentBusiness) {
    throw new Error('Parent business not found');
  }

  return parentBusiness;
};

const getMyBusinessesList = async (userId: string) => {
  const businesses = await Business.find({ author: userId, isDeleted: false }).select("name")

  

  return businesses || [];

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
    author: { $ne: userId },
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
  console.log("business -=>>> ")
  // 1️⃣ Check business existence and status
  const business = await Business.findOne({ _id: id, isDeleted: false }).select("logo").lean();
  if (!business) {
    throw new Error('Business not found');
  }

  const authorId = business.author;

  // ⭐ Get totalCredits of the author
  const author = await User.findById(authorId).select('totalCredits customId').lean();
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
    image: business.logo,
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
    totalCredits,
    customId: author?.customId
  };
};


const updateBusiness = async (
  businessId: string,
  updateData: Partial<IBusiness>
) => {

  console.log("updateData ->>> ",{...updateData})
  const updatedBusiness = await Business.findByIdAndUpdate(
    businessId,
    {...updateData},
    { new: true }
  );

  
  return updatedBusiness;
};


const activateBusinessById = async (
  userId: string,
  businessId: string
) => {
  const business = await Business.findById(businessId);

  if (!business) {
    throw new Error('Business not found');
  }

  // Check if the user is the author (ObjectId to string comparison)
  if (business.author.toString() !== userId) {
    throw new Error('You are not allowed to update this business');
  }

  // Toggle isActive value
  const updatedBusiness = await Business.findByIdAndUpdate(
    businessId,
    { isActive: !business.isActive },
    { new: true }
  );

  console.log({updateBusiness})
  return updatedBusiness;
};

const getAllCategoryAndBusinessName = async() => {
   // Fetch all categories with only the name
    const categories = await Category.find(
      { type: "Provider", isDeleted: false },
      'name'  // Only select the 'name' field for categories
    );

    // Fetch all businesses with their name and category
    const businesses = await Business.find({isDeleted: false}, 'name');  // Adjust the field if needed

   // Combine categories and businesses into a single array
    const combinedData = [
      ...categories.map((category) => ({ type: 'category', name: category.name })),
      ...businesses.map((business) => ({ type: 'business', name: business.name }))
    ];

    return combinedData;
}


const getAllBusinessesNameList = async() => {
   const businesses = await Business.find({isDeleted: false}, 'name');
   return businesses
}


const searchEntities = async (searchQuery: string) => {
  // Regex search for the query
  const regexQuery = new RegExp(searchQuery, 'i');  // 'i' for case-insensitive search

  // Aggregation pipeline to search for Business, Event, and Category (filtered for Provider types in Category)
  const results = await Promise.all([
    // Search in Business
    Business.find({
      name: { $regex: regexQuery },
    }).select('name _id type'),

    // Search in Event (no type filtering needed for Event)
    Event.find({
      name: { $regex: regexQuery },
    }).select('name _id type'),

    // Search in Category (filtered for Event and Provider types)
    Category.find({
      name: { $regex: regexQuery },
      type: { $in: ['Event', 'Provider'] },  // Filter for Event and Provider types in Category
    }).select('name _id type'),
  ]);

  // Combine all results and return
  return {
    businessResults: results[0],
    eventResults: results[1],
    categoryResults: results[2],
  };
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
  const events = await Event.find({ isDeleted: false, endDate: { $gte: today } })
    .select('name address location coverImage startDate endDate startTime endTime');

  return {
    businesses,
    events,
  };
};

const searchBusinesses = async (
  query: Record<string, unknown>,
  userId?: string
) => {
  const searchTerm = query.searchTerm as string;

  // 1. Match categories by name
  const matchedCategories = await Category.find({
    type: "Provider",
    name: { $regex: searchTerm, $options: 'i' },
    isDeleted: false,
  });
  const matchedCategoryIds = matchedCategories.map((cat) => cat._id);

  // 2. Build main query
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

  // 3. QueryBuilder for sorting, pagination, etc.
  const queryBuilder = new QueryBuilder<IBusiness>(baseQuery, query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await queryBuilder.modelQuery;
  const meta = await queryBuilder.countTotal();

  const businessIds = results.map((biz) => biz._id);

  // 4. ⭐ Get ratings
  const ratingAgg = await BusinessReview.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: '$businessId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratingAgg.forEach((entry) => {
    ratingMap[entry._id.toString()] = {
      averageRating: parseFloat(entry.averageRating.toFixed(1)),
      totalReviews: entry.totalReviews,
    };
  });

  // 5. Fetch engagement stats
  const businessEngagements = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments followers');

  const businessEngagementMap: Record<string, any> = {};
  businessEngagements.forEach((stat) => {
    const id = stat.businessId.toString();
    businessEngagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: userId ? stat.likes?.some((like) => like.toString() === userId) : false,
      isFollowed: userId ? stat.followers?.some((f) => f.toString() === userId) : false,
    };
  });

  // 6. Final response
  const populatedBusinesses = results.map((biz) => {
    const id = biz._id.toString();

    const rating = ratingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    const engagement = businessEngagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
      isFollowed: false,
    };

    return {
      ...biz.toObject(),
      ...rating,
      ...engagement,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
      type: 'business',
    };
  });

  // 7. Store search record
  await SearchRecord.create({
    keyword: searchTerm,
    totalResults: results.length,
    userId,
    searchDate: new Date(),
  });

  return { data: populatedBusinesses, meta };
};


const wizardSearchBusinesses = async (userId:string, filters: WizardFilters) => {
  const {
    categoryName = [],
    longitude,
    latitude,
    maxGuest,
    services = [],
    priceRange,
    maxDistance = 50000, // default to 50km if not provided
  } = filters;

  const query: any = { isDeleted: false };

  // 1. Category Filter
  if (categoryName.length) {
    const matchedCategories = await Category.find({
      name: { $in: categoryName },
      isDeleted: false,
    });

    const matchedCategoryIds = matchedCategories.map((cat) => cat._id);
    query.providerType = { $in: matchedCategoryIds };
  }

  // 2. Geolocation Filter (within 50 km)
  if (typeof longitude === 'number' && typeof latitude === 'number') {
    query.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    };
  }

  // 3. Guest Capacity Filter
  if (maxGuest) {
    switch (maxGuest) {
      case 'fewer than 20':
        query.maxGuest = { $lt: 20 };
        break;
      case '20-50':
        query.maxGuest = { $gte: 20, $lte: 50 };
        break;
      case '50-100':
        query.maxGuest = { $gt: 50, $lte: 100 };
        break;
      case '100-150':
        query.maxGuest = { $gt: 100, $lte: 150 };
        break;
      case '150-200':
        query.maxGuest = { $gt: 150, $lte: 200 };
        break;
      case 'more than 200':
        query.maxGuest = { $gt: 200 };
        break;
    }
  }

  // 4. Services Filter
  if (services.length) {
    query.supportedServices = { $all: services };
  }

  // 5. Price Range Filter (using enum values)
  if (priceRange) {
    query.priceRange = priceRange;
  }

  // 6. Final Query Execution
  const results = await Business.find(query).populate('providerType');

    const businessIds = results.map((biz) => biz._id);

  const businessRatings = await BusinessReview.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: '$businessId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const businessEngagements = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments followers');

  const businessRatingMap: Record<string, any> = {};
  businessRatings.forEach((r) => {
    businessRatingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  const businessEngagementMap: Record<string, any> = {};
  businessEngagements.forEach((stat) => {
    const id = stat.businessId.toString();
    businessEngagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
      isFollowed: stat.followers?.some((f) => f.toString() === userId) || false,
    };
  });

  const populatedBusinesses = results.map((biz) => {
    const id = biz._id.toString();

    const rating = businessRatingMap[id] || {
      averageRating: 0,
      totalReviews: 0,
    };

    return {
      ...biz.toObject(),
      ...rating,
      ...businessRatingMap[id],
      ...businessEngagementMap[id],
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
      type: "business"
    };
  });

  return populatedBusinesses;
};

const filterSearchBusinesses = async (
  userId: string,
  filters: {
    categoryName?: string[];
    longitude?: number;
    latitude?: number;
    priceRange?: string[];
    maxGuest?: number;
    sortPriceRange: string,
  }
) => {
  const {
    categoryName = [],
    longitude,
    latitude,
    priceRange = [],
    maxGuest,
    sortPriceRange = "asc"
  } = filters;

  const query: any = { isDeleted: false };

  // 1. Category Filter
  if (categoryName.length) {
    const matchedCategories = await Category.find({
      name: { $in: categoryName },
      isDeleted: false,
    });
    const matchedCategoryIds = matchedCategories.map((cat) => cat._id);
    query.providerType = { $in: matchedCategoryIds };
  }

  // 2. Location Filter (within 50km)
  if (typeof longitude === 'number' && typeof latitude === 'number') {
    query.location = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: 50000, // 50km
      },
    };
  }

  // 3. Price Range Filter
  if (priceRange.length) {
    query.priceRange = { $in: priceRange };
  }

  console.log('MAX GUEST ->>> ', typeof maxGuest)
  // 4. Max Guest Filter
  if (typeof maxGuest === 'number') {
    query.maxGuest = { $gte: maxGuest };
  }

  // 5. Execute main query
  const businesses = await Business.find(query).populate('providerType');
  const businessIds = businesses.map((b) => b._id);

  // 6. Ratings aggregation
  const ratingsAgg = await BusinessReview.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: '$businessId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const ratingMap: Record<string, { averageRating: number; totalReviews: number }> = {};
  ratingsAgg.forEach((r) => {
    ratingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  // 7. Engagement stats
  const engagementStats = await BusinessEngagementStats.find({
    businessId: { $in: businessIds },
  }).select('businessId likes comments followers');

  const engagementMap: Record<
    string,
    { totalLikes: number; totalComments: number; isLiked: boolean; isFollowed: boolean }
  > = {};

  engagementStats.forEach((stat) => {
    const id = stat.businessId.toString();
    engagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: userId ? stat.likes?.includes(userId) : false,
      isFollowed: userId ? stat.followers?.includes(userId) : false,
    };
  });

  // 8. Enrich and sort by priceRange
  const priceOrder = {
    luxury: 4,
    high: 3,
    medium: 2,
    budget: 1,
  };

  const enriched = businesses.map((biz) => {
    const id = biz._id.toString();
    const rating = ratingMap[id] || { averageRating: 0, totalReviews: 0 };
    const engagement = engagementMap[id] || {
      totalLikes: 0,
      totalComments: 0,
      isLiked: false,
      isFollowed: false,
    };

    return {
      ...biz.toObject(),
      ...rating,
      ...engagement,
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
    };
  });

  // 9. Sort by price priority
  enriched.sort((a, b) => {
    const aPriority = priceOrder[a.priceRange as keyof typeof priceOrder] || 0;
    const bPriority = priceOrder[b.priceRange as keyof typeof priceOrder] || 0;
    
  if (sortPriceRange === 'asc') {
    return aPriority - bPriority; // lower price first
  } else {
    return bPriority - aPriority; // higher price first (default)
  }
  });

  return enriched;
};

const getAllBusinessQueryNameList = async (userId: string, query: Record<string, unknown>) => {
  const businessQuery = new QueryBuilder(Business.find({ author: { $ne: userId },isActive: true, isDeleted: false}).select("name author description email") as any, query)
    .search(['name', 'description', 'email', "address"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await businessQuery.modelQuery;
  const meta = await businessQuery.countTotal();
  return { meta, result };
};

const calculateCompetitionScore = async (
  businessId: string
) => {

  console.log("service business id->> ", { businessId })
  // Step 1: Fetch the business
  const business = await Business.findById(businessId)
    .select('location providerType')
    .lean();

  console.log({ business });
  if (!business || !business.location || !business.providerType) {
    throw new Error('Business must have location and category to calculate competition.');
  }

  const [longitude, latitude] = business.location.coordinates;

  // Step 2: Find all businesses within 50km and same category
  const radiusInKm = 50;
  const businesses = await Business.find({
    _id: { $ne: businessId },
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusInKm * 1000, // convert to meters
      },
    },
    providerType: new mongoose.Types.ObjectId(business.providerType.toString()),
    isDeleted: false,
  }).select('subscriptionType');

  console.log("business ->>>>>>", businesses)

  const weights = {
    exclusive: 5,
    elite: 3,
    prime: 2,
    none: 0.5,
  };

  console.log({ weights })

  // Step 3: Count types
  let P1 = 0, P2 = 0, P3 = 0, FREE = 0;
  for (const b of businesses) {
    switch (b.subscriptionType) {
      case 'exclusive':
        P1++;
        break;
      case 'elite':
        P2++;
        break;
      case 'prime':
        P3++;
        break;
      default:
        FREE++;
    }
  }

  console.log({P1,P2,P3,FREE})

  const TOTAL = P1 + P2 + P3 + FREE;

  // Step 4: Apply competition score formula
  const numerator = (P1 * weights.exclusive) + (P2 * weights.elite) + (P3 * weights.prime) + (FREE * weights.none);
  const denominator = TOTAL * 4.5 || 1; // Avoid division by zero
  const score = (numerator / denominator) * 100;
  const roundedScore = Math.round(score);

  // Step 5: Suggest pack
  let suggestedPack: CompetitionResult['suggestedPack'] = 'PRIME';

  
  if (roundedScore > 60) {
    suggestedPack = 'EXCLUSIVE';
  } else if (roundedScore > 30) {
    suggestedPack = 'ELITE';
  }

  const plusActive = roundedScore >= 80;

  return {
    competitionScore: roundedScore,
    suggestedPack,
    plusActive,
  };
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
  getSpecificBusinessStats,
  getMyBusinessesList,
  calculateCompetitionScore,
  wizardSearchBusinesses,
  getMyParentBusiness,
  filterSearchBusinesses,
  getBusinessList,
  activateBusinessById,
  getAllBusinessQueryNameList,
  getBusinessNameList,
  getAllBusinessByLocation,
  searchEntities,
  getAllCategoryAndBusinessName,
  getAllBusinessesNameList
};
