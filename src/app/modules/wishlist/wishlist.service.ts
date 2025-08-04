import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import WishList from './wishlist.model';
import { User } from '../user/user.models';
import Business from '../business/business.model';
import Job from '../job/job.model';
import Event from '../event/event.model';
import BusinessReview from '../businessReview/businessReview.model';
import BusinessEngagementStats from '../businessEngaagementStats/businessEngaagementStats.model';
import EventReview from '../eventReview/eventReview.model';
import EventEngagementStats from '../eventEngagementStats/eventEngagementStats.model';

// const createOrUpdateFolder = async (
//   userId: string,
//   folderName: string,
//   businesses: string[] = [],
//   events: string[] = [],
//   jobs: string[] = []
// ) => {
//   const wishlist = await WishList.findOneAndUpdate(
//     {
//       userId,
//       'folders.folderName': { $ne: folderName } // only if folder doesn't exist
//     },
//     {
//       $push: {
//         folders: {
//           folderName,
//           businesses,
//           events,
//           jobs
//         }
//       }
//     },
//     { upsert: true, new: true }
//   );

//   return wishlist;
// };


const createOrUpdateFolder = async (
  userId: string,
  folderName: string,
  businessId?: string,
  eventId?: string,
  jobId?: string
) => {
  const hasValidInput = !!businessId || !!eventId || !!jobId;
  if (!hasValidInput) {
    throw new Error('You must provide a businessId, eventId, or jobId');
  }

  console.log({userId,folderName})

  const wishlist = await WishList.findOne({ userId });

  if (!wishlist) {
    // 🌱 First time: Create wishlist and folder
    const newFolder: any = {
      folderName,
      businesses: businessId ? [businessId] : [],
      events: eventId ? [eventId] : [],
      jobs: jobId ? [jobId] : [],
    };
    
    const newWishlist =  await WishList.create({
      userId,
      folders: [newFolder],
    });

    // ALSO update User's wishlist array with folderName
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: folderName },
    });

    return newWishlist;
  }

  // 🧠 Check for existing folder
  const folder = wishlist.folders.find(f => f.folderName === folderName);

  if (!folder) {
    // 📁 Create new folder with the ID
    const newFolder: any = {
      folderName,
      businesses: businessId ? [businessId] : [],
      events: eventId ? [eventId] : [],
      jobs: jobId ? [jobId] : [],
    };
    wishlist.folders.push(newFolder);

    // ALSO update User's wishlist array with folderName (if not already there)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: folderName },
    });
  } else {
    // 🛠️ Folder exists — add to correct list without duplicate
    if (businessId && !folder.businesses.includes(businessId)) {
      folder.businesses.push(businessId);
    }

    if (eventId && !folder.events.includes(eventId)) {
      folder.events.push(eventId);
    }

    if (jobId && !folder.jobs.includes(jobId)) {
      folder.jobs.push(jobId);
    }
  }

  await wishlist.save();
  return wishlist;
};


const getWishlistByUser = async (userId: string) => {
  const wishlist = await WishList.findOne({ userId }).lean();

  if (!wishlist) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
    return null;
  }

  console.log({wishlist})
  // Manually populate each folder's references
  const populatedFolders = await Promise.all(
    wishlist.folders.map(async (folder) => {
      const [businesses, events, jobs] = await Promise.all([
        Business.find({ _id: { $in: folder.businesses } }).select('name coverImage'),
        Event.find({ _id: { $in: folder.events } }).select('name coverImage'),
        Job.find({ _id: { $in: folder.jobs } }).select('title coverImage'),
      ]);

      return {
        ...folder,
        businesses,
        events,
        jobs,
      };
    })
  );

  console.log({populatedFolders})

  return {
    ...wishlist,
    folders: populatedFolders,
  };
};

const updateFolderIsActive = async (
  userId: string,
  folderName: string,
  isActive: boolean
) => {
  const updatedWishlist = await WishList.findOneAndUpdate(
    { userId, 'folders.folderName': folderName },
    {
      $set: {
        'folders.$.isActive': isActive,
      },
    },
    { new: true }
  ).lean();

  if (!updatedWishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder or user not found');
  }

  return updatedWishlist;
};

const getCheckWishlistByUser = async (userId: string) => {
  const wishlist = await WishList.findOne({ userId }).lean();

  if (!wishlist) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
    return null;
  }

  const updatedFolders = await Promise.all(
    wishlist.folders.map(async (folder) => {
      const totalItems =
        (folder.businesses?.length || 0) +
        (folder.events?.length || 0) +
        (folder.jobs?.length || 0);

      let coverImage = null;

      if (folder.businesses?.[0]) {
        const business = await Business.findById(folder.businesses[0])
          .select('coverImage')
          .lean();
        coverImage = business?.coverImage || null;
      } else if (folder.events?.[0]) {
        const event = await Event.findById(folder.events[0])
          .select('coverImage')
          .lean();
        coverImage = event?.coverImage || null;
      } else if (folder.jobs?.[0]) {
        const job = await Job.findById(folder.jobs[0])
          .select('coverImage')
          .lean();
        coverImage = job?.coverImage || null;
      }

      return {
        folderName: folder.folderName,
        isActive: folder.isActive, // fallback to default true
        totalItems,
        coverImage,
      };
    })
  );

  return updatedFolders;
};


const getWishlistFolderDetailsByName = async (
  userId: string,
  folderName: string
) => {
  const wishlist = await WishList.findOne({ userId }).lean();

  if (!wishlist) {
    return null;
    // throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
  }

  const targetFolder = wishlist.folders.find(
    (folder) => folder.folderName === folderName
  );

  if (!targetFolder) {
    // throw new AppError(httpStatus.NOT_FOUND, 'Folder not found');
    return null;
  }

  // Fetch businesses
  const businesses = await Business.find({ _id: { $in: targetFolder.businesses } })
    .select('name coverImage address priceRange maxGuest subscriptionType createdAt providerType')
    .populate('providerType', 'name');

  const businessIds = businesses.map((biz) => biz._id);

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

  const populatedBusinesses = businesses.map((biz) => {
    const id = biz._id.toString();
    return {
      ...biz.toObject(),
      ...businessRatingMap[id],
      ...businessEngagementMap[id],
      blueVerifiedBadge: biz.subscriptionType === 'exclusive',
      type: "business"
    };
  });

  // Fetch events
  const events = await Event.find({ _id: { $in: targetFolder.events } }).select(
    'name coverImage address entranceFee subscriptionType createdAt'
  );

  const eventIds = events.map((event) => event._id);

  const eventRatings = await EventReview.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    {
      $group: {
        _id: '$eventId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const eventEngagements = await EventEngagementStats.find({
    eventId: { $in: eventIds },
  }).select('eventId likes comments');

  const eventRatingMap: Record<string, any> = {};
  eventRatings.forEach((r) => {
    eventRatingMap[r._id.toString()] = {
      averageRating: parseFloat(r.averageRating.toFixed(1)),
      totalReviews: r.totalReviews,
    };
  });

  const eventEngagementMap: Record<string, any> = {};
  eventEngagements.forEach((stat) => {
    const id = stat.eventId.toString();
    eventEngagementMap[id] = {
      totalLikes: stat.likes?.length || 0,
      totalComments: stat.comments?.length || 0,
      isLiked: stat.likes?.some((like) => like.toString() === userId) || false,
    };
  });

  const populatedEvents = events.map((event) => {
    const id = event._id.toString();
    return {
      ...event.toObject(),
      ...eventRatingMap[id],
      ...eventEngagementMap[id],
      blueVerifiedBadge: ['diamond', 'emerald'].includes(event.subscriptionType),
      type: "event"
    };
  });

  // Fetch jobs
  const jobs = await Job.find({ _id: { $in: targetFolder.jobs } }).select(
    'title coverImage category address createdAt subscriptionType'
  );

  const jobIds = jobs.map((job) => job._id);

  const populatedJobs = jobs.map((job) => {
    const id = job._id.toString();
    return {
      ...job.toObject(),
      blueVerifiedBadge: ['visualTop', 'visualMedia'].includes(job.subscriptionType),
      type: "job"
    };
  });

  return {
    folderName: targetFolder.folderName,
    businesses: populatedBusinesses,
    events: populatedEvents,
    jobs: populatedJobs,
  };
};



export const wishListService = {
  createOrUpdateFolder,
  getWishlistByUser,
  getCheckWishlistByUser,
  updateFolderIsActive,
  getWishlistFolderDetailsByName
};
