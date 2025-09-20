import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import Job from './job.model';
import { IJob } from './job.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose from 'mongoose';
import JobProfileViews from '../jobProfileViews/jobProfileViews.model';
import JobReview from '../jobReview/jobReview.model';
import JobEngagementStats from '../jobEngagementStats/jobEngagementStats.model';
import { Types } from 'mongoose';
import { monthNames } from '../business/business.utils';
import JobApplicant from '../jobApplicant/jobApplicant.model';
import WishList from '../wishlist/wishlist.model';
import { User } from '../user/user.models';
import Category from '../category/category.model';

const createJob = async (payload: IJob) => {
  const result = await Job.create(payload);
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create job');
  return result;
};

const getAllJobs = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;
  query['isActive'] = true;

  const baseQuery = Job.find({ isDeleted: false, isActive: true, author: { $ne: userId } });

  const jobModel = new QueryBuilder(baseQuery, query)
    .search(['title', 'email', 'phoneNumber', 'category', 'address'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await jobModel.modelQuery;
  const meta = await jobModel.countTotal();

  if (!data?.length) return { data, meta };

  // 🟢 Fetch user's wishlist job IDs
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListJobIds = new Set<string>();

  if (wishList?.folders?.length) {
    wishList.folders.forEach((folder) => {
      folder.jobs?.forEach((jid) => wishListJobIds.add(jid.toString()));
    });
  }

  // 🔀 Merge wishlist flag
  data = data.map((job) => {
    const id = job._id.toString();
    return {
      ...job.toObject(),
      isWishlisted: wishListJobIds.has(id),
    };
  }) as any;

  // 🔽 Sort: subscription first (with type priority), then others by newest
  const subscriptionOrder = ['visualTop', 'visualMedia', 'visualBase', 'none'];

  data = data.sort((a, b) => {
    // যদি subscription type থাকে তবে priority অনুযায়ী sort হবে
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');

    if (posA !== posB) return posA - posB;

    // একই টাইপ হলে নতুন job আগে আসবে
    return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
  });

  return { data, meta };
};


// const getJobs = async (
//   userId: string,
//   query: Record<string, any>,
//   isSubscription: boolean
// ) => {
//   query['isDeleted'] = false;

//   // 🟢 Build base query (filter by subscription flag)
//   const baseQuery = Job.find({
//     author: { $ne: userId },
//     isSubscription,
//   });

//   const jobModel = new QueryBuilder(baseQuery, query)
//     .search(['title', 'email', 'phoneNumber', 'category', 'address'])
//     .filter()
//     .paginate()
//     .sort()
//     .fields();

//   let data = await jobModel.modelQuery;
//   const meta = await jobModel.countTotal();

//   if (!data?.length) return { data, meta };

//   // 🟢 Fetch user's wishlist jobs
//   const wishList = await WishList.findOne({ userId }).lean();
//   const wishListJobIds = new Set<string>();

//   if (wishList?.folders?.length) {
//     wishList.folders.forEach((folder) => {
//       folder.jobs?.forEach((jid) => wishListJobIds.add(jid.toString()));
//     });
//   }

//   // 🔀 Merge wishlist flag
//   data = data.map((job) => {
//     const id = job._id.toString();
//     return {
//       ...job.toObject(),
//       isWishlisted: wishListJobIds.has(id),
//     };
//   });

//   // 🔽 Sorting
//   if (isSubscription) {
//     // Subscription: priority by subscriptionType, then newest
//     const subscriptionOrder = ['visualTop', 'visualMedia', 'visualBase', 'none'];
//     data = data.sort((a, b) => {
//       const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
//       const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');
//       if (posA !== posB) return posA - posB;
//       return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//     });
//   } else {
//     // Unsubscription: newest first
//     data = data.sort(
//       (a, b) =>
//         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//     );
//   }

//   return { data, meta };
// };

const getAllCategoryAndJobName = async() => {
   // Fetch all categories with only the name
    const categories = await Category.find(
      { type: "job", isDeleted: false },
      'name'  // Only select the 'name' field for categories
    );

    // Fetch all businesses with their name and category
    const jobs = await Job.find({isDeleted: false, isActive: true}, 'title');  // Adjust the field if needed

   // Combine categories and businesses into a single array
    const combinedData = [
      ...categories.map((category) => ({ type: 'category', name: category.name })),
      ...jobs.map((job) => ({ type: 'job', name: job.title }))
    ];

    return combinedData;
}

const getSubscriptionJobs = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;
  query['isActive'] = true;

  const baseQuery = Job.find({ author: { $ne: userId },  isSubscription: true});

  const jobModel = new QueryBuilder(baseQuery, query)
    .search(['title', 'email', 'phoneNumber', 'category', 'address'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await jobModel.modelQuery;
  const meta = await jobModel.countTotal();

  if (!data || data.length === 0) return { data, meta };

    // 🟢 Fetch user wishlist jobs
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListJobIds = new Set<string>();

  if (wishList && wishList.folders?.length) {
    wishList.folders.forEach((folder) => {
      if (folder.jobs?.length) {
        folder.jobs.forEach((jid) => wishListJobIds.add(jid.toString()));
      }
    });
  }

   // 🔀 Merge wishlist flag into jobs
  data = data.map((job) => {
    const id = job._id.toString();
    return {
      ...job.toObject(),
      isWishlisted: wishListJobIds.has(id), // ✅ true if in wishlist
    };
  }) as any;
  
  // 🟢 Add any future job-related aggregation logic here (e.g., applications, views, etc.)

  // 🔽 Sort by subscriptionType priority then latest
  const subscriptionOrder = ['visualTop', 'visualMedia', 'visualBase', 'none'];
  data = data.sort((a, b) => {
    const posA = subscriptionOrder.indexOf(a.subscriptionType ?? 'none');
    const posB = subscriptionOrder.indexOf(b.subscriptionType ?? 'none');
    if (posA !== posB) return posA - posB;
    return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
  });

  return { data, meta };
};

const getUnsubscriptionJobs = async (userId: string, query: Record<string, any>) => {
  query['isDeleted'] = false;
  query['isActive'] = true;

  const baseQuery = Job.find({
    author: { $ne: userId },
    isSubscription: false,
  });

  const jobModel = new QueryBuilder(baseQuery, query)
    .search(['title', 'email', 'phoneNumber', 'category', 'address'])
    .filter()
    .paginate()
    .sort()
    .fields();

  let data = await jobModel.modelQuery;
  const meta = await jobModel.countTotal();

  if (!data?.length) {
    return { data, meta };
  }

  // 🟢 Fetch user's wishlist job IDs
  const wishList = await WishList.findOne({ userId }).lean();
  const wishListJobIds = new Set<string>();

  if (wishList?.folders?.length) {
    wishList.folders.forEach((folder) => {
      folder.jobs?.forEach((jid) => wishListJobIds.add(jid.toString()));
    });
  }

  // 🔀 Merge wishlist flag into jobs
  data = data.map((job) => {
    const id = job._id.toString();
    return {
      ...job.toObject(),
      isWishlisted: wishListJobIds.has(id),
    };
  }) as any;

  // 🔽 Sort by newest first
  data = data.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());

  return { data, meta };
};

// const getUnsubscriptionJobs = async (userId: string, query: Record<string, any>) => {
//   query['isDeleted'] = false;

//   const baseQuery = Job.find({ author: { $ne: userId }, isSubscription: false });

//   console.log("get unsubscription query ->>> ", query);
//   // console.log("get unsubscription base query ->>> ", baseQuery);
//   console.log("get unsubscription userId ->>> ", userId);

//   const jobModel = new QueryBuilder(baseQuery, query)
//     .search(['title', 'email', 'phoneNumber', 'category', 'address'])
//     .filter()
//     .paginate()
//     .sort()
//     .fields();
  
  

//   const data = await jobModel.modelQuery;
//   const meta = await jobModel.countTotal();

//   console.log({data,meta})

//   // 🟢 You can enrich the data here if needed (e.g., job views, applicant stats)

//   return { data, meta };
// };



// const getJobById = async (id: string) => {
//   const result = await Job.findById(id);
//   if (!result || result.isDeleted) throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
//   return result;
// };
const getJobById = async (userId: string, id: string) => {
  const job = await Job.findById(id).populate("author", "name sureName");

  if (!job || job.isDeleted) {
    // throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
    return null;
  }

  const jobId = job._id;

  // 🔄 Log view in background
  JobProfileViews.findOneAndUpdate(
    { jobId },
    {
      $push: {
        viewUsers: {
          user: userId,
          viewedAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  ).exec();

  // ⭐ Get Rating
  const ratingAgg = await JobReview.aggregate([
    { $match: { jobId } },
    {
      $group: {
        _id: '$jobId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const rating = ratingAgg[0] || {
    averageRating: 0,
    totalReviews: 0
  };

  // ⭐ Get Engagement Stats + Comments
  const engagement = await JobEngagementStats.findOne({ jobId })
    .populate('comments.user', 'name profileImage')
    .select('likes comments');

  const engagementInfo = {
    totalComments: engagement?.comments?.length || 0,
    comments: (engagement?.comments || []).map(comment => ({
      // _id: comment._id,
      text: comment.text,
      createdAt: (comment as any).createdAt,
      user: comment.user// already populated with name and profileImage
    }))
  };

  // ⭐ Related Jobs (same category, not deleted, active)
  const relatedJobsRaw = await Job.find({
    _id: { $ne: jobId },
    categoryId: job.categoryId,
    isDeleted: false,
    // isActive: true,
  })
    .select('title logo category address coverImage')
    .limit(10);
  
  console.log({relatedJobsRaw})

  const relatedJobIds = relatedJobsRaw.map((j) => j._id);

  // ⭐ Get ratings for sorting only
  const ratings = await JobReview.aggregate([
    { $match: { jobId: { $in: relatedJobIds } } },
    {
      $group: {
        _id: '$jobId',
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  const ratingMap: Record<string, number> = {};
  ratings.forEach((r) => {
    ratingMap[r._id.toString()] = r.averageRating;
  });

  // 🔁 Sort related jobs by rating (but don’t return the rating)
  const relatedJobs = relatedJobsRaw
    .map((job) => ({
      ...job.toObject(),
      __rating: ratingMap[job._id.toString()] || 0, // temp field for sorting
    }))
    .sort((a, b) => b.__rating - a.__rating)
    .slice(0, 5) // top 5
    .map(({ __rating, ...job }) => job); // remove __rating before returning
  // ✅ Final enriched object
  return {
    ...job.toObject(),
    averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
    totalReviews: rating.totalReviews || 0,
    totalComments: engagementInfo.totalComments,
    comments: engagementInfo.comments,
    relatedJobs
  };
};

const getAllJobsList = async () => {
  const jobs = await Job.find({ isDeleted: false }).populate("author", "sureName name email").populate("businessId", 'name');
  const jobIds = jobs.map((job) => job._id);

  // ⭐ Aggregate Ratings
  const ratingAgg = await JobReview.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    {
      $group: {
        _id: '$jobId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  // ⭐ Aggregate Total Comments
  const commentAgg = await JobEngagementStats.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    {
      $project: {
        jobId: 1,
        totalComments: { $size: '$comments' },
      },
    },
  ]);

  // 🗺️ Map Results
  const ratingMap = new Map<string, { averageRating: number; totalReviews: number }>();
  ratingAgg.forEach((r) => {
    ratingMap.set(r._id.toString(), {
      averageRating: r.averageRating,
      totalReviews: r.totalReviews,
    });
  });

  const commentMap = new Map<string, number>();
  commentAgg.forEach((c) => {
    commentMap.set(c.jobId.toString(), c.totalComments);
  });

  // 🔁 Enrich Jobs
  const enrichedJobs = jobs.map((job) => {
    const jobId = job._id.toString();
    const rating = ratingMap.get(jobId) || { averageRating: 0, totalReviews: 0 };
    const totalComments = commentMap.get(jobId) || 0;

    return {
      ...job.toObject(),
      averageRating: parseFloat(rating.averageRating.toFixed(1)),
      totalReviews: rating.totalReviews,
      totalComments,
    };
  });

  return enrichedJobs;
};

const getMyJobs = async (userId: string) => {


  const jobs = await Job.find({ author: userId, isDeleted: false }) || [];



  const enrichedJobs = await Promise.all(
    jobs.map(async (job) => {
      const jobId = job._id;

      // 🔄 Log view in background
      JobProfileViews.findOneAndUpdate(
        { jobId },
        {
          $push: {
            viewUsers: {
              user: new mongoose.Types.ObjectId(userId),
              viewedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      ).exec();

      // ⭐ Get Rating
      const ratingAgg = await JobReview.aggregate([
        { $match: { jobId } },
        {
          $group: {
            _id: '$jobId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      const rating = ratingAgg[0] || {
        averageRating: 0,
        totalReviews: 0,
      };

      // ⭐ Engagement Stats + Comments
      const engagement = await JobEngagementStats.findOne({ jobId })
        .populate('comments.user', 'name profileImage')
        .select('likes comments');

      const engagementInfo = {
        totalComments: engagement?.comments?.length || 0,
        comments: (engagement?.comments || []).map((comment) => ({
          text: comment.text,
          createdAt: (comment as any).createdAt,
          user: comment.user,
        })),
      };

      // ⭐ Related Jobs (same category, not deleted, not same job)
      const relatedJobsRaw = await Job.find({
        _id: { $ne: jobId },
        categoryId: job.categoryId,
        isDeleted: false,
        // isActive: true,
      })
        .select('title logo category address coverImage')
        .limit(10);

      const relatedJobIds = relatedJobsRaw.map((j) => j._id);

      // ⭐ Ratings for related jobs
      const ratings = await JobReview.aggregate([
        { $match: { jobId: { $in: relatedJobIds } } },
        {
          $group: {
            _id: '$jobId',
            averageRating: { $avg: '$rating' },
          },
        },
      ]);

      const ratingMap: Record<string, number> = {};
      ratings.forEach((r) => {
        ratingMap[r._id.toString()] = r.averageRating;
      });

      // 🔁 Sort related jobs by rating
      const relatedJobs = relatedJobsRaw
        .map((job) => ({
          ...job.toObject(),
          __rating: ratingMap[job._id.toString()] || 0,
        }))
        .sort((a, b) => b.__rating - a.__rating)
        .slice(0, 5)
        .map(({ __rating, ...job }) => job);

      // ✅ Return enriched job
      return {
        ...job.toObject(),
        averageRating: parseFloat(rating.averageRating?.toFixed(1)) || 0,
        totalReviews: rating.totalReviews || 0,
        totalComments: engagementInfo.totalComments,
        comments: engagementInfo.comments,
        relatedJobs,
      };
    })
  );

  return enrichedJobs || [];
};

const getMyJobsList = async (userId: string) => {


  const jobs = await Job.find({ author: userId, isDeleted: false }).select("title") || [];

 

  return jobs;
};

const updateJob = async (
  id: string,
  payload: Partial<IJob> & { deleteGallery?: string[] } // adjust array name if different
) => {
  // Fetch existing job
  const existingJob = await Job.findById(id);
  if (!existingJob) throw new AppError(httpStatus.BAD_REQUEST, 'Job not found');

  let newGallery = existingJob.gallery || []; // adjust field name if needed

  // Remove images if deleteGallery is provided
  if (payload.deleteGallery && payload.deleteGallery.length > 0) {
    newGallery = newGallery.filter(
      img => !payload.deleteGallery!.includes(img)
    );
  }

  // Append new images if provided
  if (payload.gallery && payload.gallery.length > 0) {
    newGallery = [...newGallery, ...payload.gallery];
  }

  // Update the gallery in payload
  payload.gallery = newGallery;

  // Remove deleteGallery to avoid saving in DB
  delete payload.deleteGallery;

  const result = await Job.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update job');

  return result;
};


const activateJobById = async (
  userId: string,
  jobId: string
) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw new Error('job not found');
  }

  // Check if the user is the author (ObjectId to string comparison)
  if (job.author.toString() !== userId) {
    throw new Error('You are not allowed to update this job');
  }

  // Toggle isActive value
  const updatedjob = await Job.findByIdAndUpdate(
    jobId,
    { isActive: !job.isActive },
    { new: true }
  );

  return updatedjob;
};

const deleteJob = async (id: string) => {
  const result = await Job.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete job');
  return result;
};

const getLatestJobs = async (userId: string, limit: number = 10) => {
  const jobs = await Job.aggregate([
    {
      $match: {
        author: { $ne: new mongoose.Types.ObjectId(userId) },
        isDeleted: false,
        // isActive: true
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'jobengagementstats',
        localField: '_id',
        foreignField: 'jobId',
        as: 'engagement'
      }
    },
    {
      $addFields: {
        engagementStats: { $arrayElemAt: ['$engagement', 0] }
      }
    },
    {
      $addFields: {
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { authorId: '$author' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$authorId'] }
            }
          },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'author'
      }
    },
    {
      $unwind: {
        path: '$author',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        engagement: 0,
        engagementStats: 0
      }
    }
  ]);


  console.log("jobs ->>> ", jobs)
  return jobs;
};

const getSpecificJobStats = async (jobId: string) => {
  const id = new Types.ObjectId(jobId);

  // 1️⃣ Check job existence and status
  const job = await Job.findOne({ _id: id, isDeleted: false }).select("logo subscriptionStatus expireSubscriptionTime").lean();
  if (!job) {
    throw new Error('job not found');
  }


  const authorId = job.author;
    // ⭐ Get totalCredits of the author
  const author = await User.findById(authorId).select('totalCredits customId').lean();
  const totalCredits = author?.totalCredits || 0;
 

  // 2️⃣ Get engagement stats (followers, likes, comments)
  const engagement = await JobEngagementStats.findOne({ jobId: id }).lean();
  const totalComments = engagement?.comments?.length || 0;

  // 3️⃣ Get profile views & monthly breakdown
  const viewsDoc = await JobProfileViews.findOne({ jobId: id }).lean();
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



  // 5️⃣ Get active subscription info
  const now = new Date();
  const activeSubscriptions = job.subscriptionList?.filter(
    (sub) => sub.expireDate && new Date((sub as any).expireDate) > now
  ) || [];

  const activeSubscription = activeSubscriptions[0] || null;
  const totalActiveSub = job.subscriptionStatus === 'activated' ? 1 : 0;
  const subscriptionEndTime = job.expireSubscriptionTime || null;

  const applicantsDoc = await JobApplicant.findOne({ jobId: jobId }).lean();
  const jobApplicants = applicantsDoc?.applicantUsers.length || 0;


  // ✅ Final return object
  return {
    jobId,
    image: job.logo,
    totalComments,
    jobViews: profileViews,
    monthlyViews,
    activeSubscription: activeSubscription
      ? {
          type: activeSubscription.type,
          expireDate: activeSubscription.expireDate
        }
      : null,
    totalActiveSub,
    jobApplicants,
    totalCredits,
    subscriptionEndTime
  };
};

const calculateCompetitionScoreForJob = async (job: any): Promise<number> => {
  if (!job.categoryId) return 0;

  // Count how many jobs are in the same category
  const totalJobsInCategory = await Job.countDocuments({
    categoryId: job.categoryId,
    isActive: true,
    isDeleted: false
  });

  if (totalJobsInCategory === 0) return 100;

  let baseScore = 100 - ((1 / totalJobsInCategory) * 100);

  // Apply boost based on subscription
  if (job.isSubscription) {
    switch (job.subscriptionType) {
      case 'visualTop':
        baseScore += 10;
        break;
      case 'visualMedia':
        baseScore += 5;
        break;
      case 'visualBase':
        baseScore += 3;
        break;
      default:
        break;
    }
  }

  // Cap the score between 0 and 100
  return Math.min(100, Math.max(0, parseFloat(baseScore.toFixed(2))));
};

export const jobService = {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
  getLatestJobs,
  getSubscriptionJobs,
  getUnsubscriptionJobs,
  getMyJobsList,
  getSpecificJobStats,
  getAllJobsList,
  activateJobById,
  calculateCompetitionScoreForJob,
  getAllCategoryAndJobName
};
