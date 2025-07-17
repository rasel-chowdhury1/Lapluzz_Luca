import PostCommunity from './postCommunity.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose from 'mongoose';

const createPost = async (payload: any) => {
  const post = await PostCommunity.create(payload);
  if (!post) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create post');
  return post;
};

const getAllPosts = async (query: Record<string, any>) => {
  const filters: any = {};
  if (query.category) filters.category = query.category;
  if (query.region) filters.region = query.region;

  const posts = await PostCommunity.find(filters).populate('creator', 'name email');
  return posts;
};

// const getPostById = async (id: string) => {
//   const post = await PostCommunity.findById(id).populate('creator', 'name email');
//   if (!post) throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
//   return post;
// };

const getPostById = async (id: string, userId: string) => {
  const posts = await PostCommunity.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id)
      }
    },
    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
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
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] }
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
        }
      }
    },
    // 👤 Populate creator details
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: {
        path: '$creator',
        preserveNullAndEmptyArrays: true
      }
    },
    // 💬 Populate comments.user details
    {
      $lookup: {
        from: 'users',
        localField: 'engagementStats.comments.user',
        foreignField: '_id',
        as: 'commentUsers'
      }
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: { $ifNull: ['$engagementStats.comments', []] },
            as: 'comment',
            in: {
              text: '$$comment.text',
              user: {
                $let: {
                  vars: {
                    matchedUser: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$commentUsers',
                            as: 'u',
                            cond: { $eq: ['$$u._id', '$$comment.user'] }
                          }
                        },
                        0
                      ]
                    }
                  },
                  in: {
                    _id: '$$matchedUser._id',
                    name: '$$matchedUser.name',
                    profileImage: '$$matchedUser.profileImage'
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        engagement: 0,
        engagementStats: 0,
        commentUsers: 0
      }
    }
  ]);

  if (!posts.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return posts[0];
};

const deletePost = async (id: string) => {
  const result = await PostCommunity.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete post');
  return result;
};



// ✅ Get posts created by a specific user, with total likes/comments
const getMyPosts = async (userId: string) => {

  console.log("Post community ", {userId})
  const posts = await PostCommunity.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
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
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] }
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
        }
      }
    },
        // 👤 Populate only name, sureName, profileImage
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: {
        path: '$creator',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        engagement: 0
      }
    }
  ]);

  return posts;
};

// ✅ Get latest posts with total likes/comments (sorted by createdAt DESC)
const getLatestPosts = async (userId: string, limit: number = 10) => {
  const posts = await PostCommunity.aggregate([
    {
      $match: {
        creator: { $ne: new mongoose.Types.ObjectId(userId) } // Exclude my own posts
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
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
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] }
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
        }
      }
    },
        // 👤 Lookup and include only selected creator fields
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: {
        path: '$creator',
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

  return posts;
};

const getSpecificCategoryOrRegionPosts = async (
  userId: string,
  limit: number = 10,
  filters?: { category?: string; region?: string }
) => {
  const matchStage: any = {
    creator: { $ne: new mongoose.Types.ObjectId(userId) },
  };

  if (filters?.category) {
    const categoryExists = await PostCommunity.exists({ category: filters.category });
    if (!categoryExists) return [];
    matchStage.category = filters.category;
  }

  if (filters?.region) {
    matchStage.region = filters.region;
  }

  const posts = await PostCommunity.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
        as: 'engagement',
      },
    },
    {
      $addFields: {
        engagementStats: { $arrayElemAt: ['$engagement', 0] },
      },
    },
    {
      $addFields: {
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] },
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] },
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }],
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1,
            },
          },
        ],
        as: 'creator',
      },
    },
    {
      $unwind: {
        path: '$creator',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        engagement: 0,
        engagementStats: 0,
      },
    },
  ]);

  return posts;
};

const getMostViewedPosts = async (userId: string, limit: number = 10) => {
  const posts = await PostCommunity.aggregate([
    {
      $match: {
        creator: { $ne: new mongoose.Types.ObjectId(userId) }
      }
    },

    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
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
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] }
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
        }
      }
    },

    // 👤 Populate only creator name, sureName, profileImage
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: {
        path: '$creator',
        preserveNullAndEmptyArrays: true
      }
    },

    // 🔽 Sort by most likes
    { $sort: { totalLikes: -1 } },
    { $limit: limit },

    {
      $project: {
        engagement: 0,
        engagementStats: 0
      }
    }
  ]);

  return posts;
};

const getMostCommentedPosts = async (userId: string, limit: number = 10) => {
  const posts = await PostCommunity.aggregate([
    {
      $match: {
        creator: { $ne: new mongoose.Types.ObjectId(userId) }
      }
    },

    // 🔍 Lookup engagement stats
    {
      $lookup: {
        from: 'postcommunityengagementstats',
        localField: '_id',
        foreignField: 'postId',
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
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] }
        },
        totalComments: {
          $size: { $ifNull: ['$engagementStats.comments', []] }
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
        }
      }
    },

    // 👤 Populate only creator fields
    {
      $lookup: {
        from: 'users',
        let: { creatorId: '$creator' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
          {
            $project: {
              name: 1,
              sureName: 1,
              profileImage: 1
            }
          }
        ],
        as: 'creator'
      }
    },
    {
      $unwind: {
        path: '$creator',
        preserveNullAndEmptyArrays: true
      }
    },

    // 🔽 Sort by totalComments
    { $sort: { totalComments: -1 } },
    { $limit: limit },

    {
      $project: {
        engagement: 0,
        engagementStats: 0
      }
    }
  ]);

  return posts;
};



export const postCommunityService = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  getMyPosts,
  getLatestPosts,
  getMostViewedPosts,
  getMostCommentedPosts,
  getSpecificCategoryOrRegionPosts
};
