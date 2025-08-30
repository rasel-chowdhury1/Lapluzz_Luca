import PostCommunity from './postCommunity.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose from 'mongoose';
import { UpdatePostCommunityPayload } from './postCommunity.interface';

const createPost = async (payload: any) => {
  const post = await PostCommunity.create(payload);
  if (!post) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create post');
  return post;
};

const updatePostCommunityById = async (
  userId: string,
  postId: string,
  payload: Partial<UpdatePostCommunityPayload>
) => {
  // Only update the post if the creator matches userId
  const updatedPost = await PostCommunity.findOneAndUpdate(
    { _id: postId, creator: userId }, // query ensures only creator can update
    payload,
    { new: true }
  );

  if (!updatedPost) {
    throw new AppError(httpStatus.BAD_REQUEST,'Post not found or you are not authorized');
  }

  return updatedPost;
};

const deletePostCommunityById = async (userId: string, postId: string) => {

  console.log({userId,postId})
  // Find the post by postId and ensure that the user is the creator and the post is not already deleted
  const deletePost = await PostCommunity.findOneAndUpdate(
    { _id: postId, creator: userId, isDeleted: false }, // query ensures only creator can delete the post and it is not already deleted
    { isDeleted: true }, // mark the post as deleted
    { new: true } // return the updated post
  );

  if (!deletePost) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Post not found, or you are not authorized to delete this post.'
    );
  }

  return deletePost; // return the deleted post with updated isDeleted status
};


const getAllPosts = async (query: Record<string, any>) => {
  const filters: any = {isDeleted: false};
  if (query.category) filters.category = query.category;
  if (query.region) filters.region = query.region;
  

  const posts = await PostCommunity.find(filters).populate('creator', 'name profileImage email role');
  return posts;
};


// const getPostById = async (id: string, userId: string) => {
//   const posts = await PostCommunity.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(id)
//       }
//     },
//     {
//       $lookup: {
//         from: 'postcommunityengagementstats',
//         localField: '_id',
//         foreignField: 'postId',
//         as: 'engagement'
//       }
//     },
//     {
//       $addFields: {
//         engagementStats: { $arrayElemAt: ['$engagement', 0] }
//       }
//     },
//     {
//       $addFields: {
//         totalLikes: {
//           $size: { $ifNull: ['$engagementStats.likes', []] }
//         },
//         totalComments: {
//           $add: [
//             { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
//             { 
//               $sum: { // Sum the replies for each comment
//                 $map: {
//                   input: { $ifNull: ['$engagementStats.comments.replies', []] },
//                   as: 'reply',
//                   in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
//                 }
//               }
//             },
//           ],
//         },
//         isLiked: {
//           $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }]
//         }
//       }
//     },
//     // 👤 Populate creator details
//     {
//       $lookup: {
//         from: 'users',
//         let: { creatorId: '$creator' },
//         pipeline: [
//           { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
//           {
//             $project: {
//               name: 1,
//               sureName: 1,
//               profileImage: 1
//             }
//           }
//         ],
//         as: 'creator'
//       }
//     },
//     {
//       $unwind: {
//         path: '$creator',
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     // 💬 Populate comments.user details
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'engagementStats.comments.user',
//         foreignField: '_id',
//         as: 'commentUsers'
//       }
//     },
//     {
//       $addFields: {
//         comments: {
//           $map: {
//             input: { $ifNull: ['$engagementStats.comments', []] },
//             as: 'comment',
//             in: {
//               text: '$$comment.text',
//               user: {
//                 $let: {
//                   vars: {
//                     matchedUser: {
//                       $arrayElemAt: [
//                         {
//                           $filter: {
//                             input: '$commentUsers',
//                             as: 'u',
//                             cond: { $eq: ['$$u._id', '$$comment.user'] }
//                           }
//                         },
//                         0
//                       ]
//                     }
//                   },
//                   in: {
//                     _id: '$$matchedUser._id',
//                     name: '$$matchedUser.name',
//                     profileImage: '$$matchedUser.profileImage',
//                     role: '$$matchedUser.role',
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     },
//     {
//       $project: {
//         engagement: 0,
//         engagementStats: 0,
//         commentUsers: 0
//       }
//     }
//   ]);

//   if (!posts.length) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
//   }

//   return posts[0];
// };


// const getPostById = async (id: string, userId: string) => {
//   const posts = await PostCommunity.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(id),
//       },
//     },
//     {
//       $lookup: {
//         from: 'postcommunityengagementstats',
//         localField: '_id',
//         foreignField: 'postId',
//         as: 'engagement',
//       },
//     },
//     {
//       $addFields: {
//         engagementStats: { $arrayElemAt: ['$engagement', 0] },
//       },
//     },
//     {
//       $addFields: {
//         totalLikes: {
//           $size: { $ifNull: ['$engagementStats.likes', []] },
//         },
//         totalComments: {
//           $add: [
//             { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
//             {
//               $sum: { // Sum the replies for each comment
//                 $map: {
//                   input: { $ifNull: ['$engagementStats.comments.replies', []] },
//                   as: 'reply',
//                   in: { $size: { $ifNull: ['$$reply', []] } }, // Count replies for each comment
//                 },
//               },
//             },
//           ],
//         },
//         isLiked: {
//           $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }],
//         },
//       },
//     },
//     // 👤 Populate creator details
//     {
//       $lookup: {
//         from: 'users',
//         let: { creatorId: '$creator' },
//         pipeline: [
//           { $match: { $expr: { $eq: ['$_id', '$$creatorId'] } } },
//           {
//             $project: {
//               name: 1,
//               sureName: 1,
//               profileImage: 1,
//             },
//           },
//         ],
//         as: 'creator',
//       },
//     },
//     {
//       $unwind: {
//         path: '$creator',
//         preserveNullAndEmptyArrays: true,
//       },
//     },
//     // 💬 Populate comments.user details
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'engagementStats.comments.user',
//         foreignField: '_id',
//         as: 'commentUsers',
//       },
//     },
//     // 💬 Populate replies.user details inside comments
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'engagementStats.comments.replies.user',
//         foreignField: '_id',
//         as: 'replyUsers',
//       },
//     },
//     {
//       $addFields: {
//         comments: {
//           $map: {
//             input: { $ifNull: ['$engagementStats.comments', []] },
//             as: 'comment',
//             in: {
//               text: '$$comment.text',
//               user: {
//                 $let: {
//                   vars: {
//                     matchedUser: {
//                       $arrayElemAt: [
//                         {
//                           $filter: {
//                             input: '$commentUsers',
//                             as: 'u',
//                             cond: { $eq: ['$$u._id', '$$comment.user'] },
//                           },
//                         },
//                         0,
//                       ],
//                     },
//                   },
//                   in: {
//                     _id: '$$matchedUser._id',
//                     name: '$$matchedUser.name',
//                     profileImage: '$$matchedUser.profileImage',
//                     role: '$$matchedUser.role',
//                   },
//                 },
//               },
//               replies: {
//                 $map: {
//                   input: { $ifNull: ['$$comment.replies', []] },
//                   as: 'reply',
//                   in: {
//                     text: '$$reply.text',
//                     user: {
//                       $let: {
//                         vars: {
//                           matchedReplyUser: {
//                             $arrayElemAt: [
//                               {
//                                 $filter: {
//                                   input: '$replyUsers',
//                                   as: 'ru',
//                                   cond: { $eq: ['$$ru._id', '$$reply.user'] },
//                                 },
//                               },
//                               0,
//                             ],
//                           },
//                         },
//                         in: {
//                           _id: '$$matchedReplyUser._id',
//                           name: '$$matchedReplyUser.name',
//                           profileImage: '$$matchedReplyUser.profileImage',
//                           role: '$$matchedReplyUser.role',
//                         },
//                       },
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         engagement: 0,
//         engagementStats: 0,
//         commentUsers: 0,
//         replyUsers: 0,
//       },
//     },
//   ]);

//   if (!posts.length) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
//   }

//   return posts[0];
// };


//update code for comment id
const getPostById = async (id: string, userId: string) => {
  const posts = await PostCommunity.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false
      },
    },
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
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            {
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } }, // Count replies for each comment
                },
              },
            },
          ],
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }], // Check if the post is liked by the user
        },
      },
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
    // 💬 Populate comments.user details
    {
      $lookup: {
        from: 'users',
        localField: 'engagementStats.comments.user',
        foreignField: '_id',
        as: 'commentUsers',
      },
    },
    // 💬 Populate replies.user details inside comments
    {
      $lookup: {
        from: 'users',
        localField: 'engagementStats.comments.replies.user',
        foreignField: '_id',
        as: 'replyUsers',
      },
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: { $ifNull: ['$engagementStats.comments', []] },
            as: 'comment',
            in: {
              _id: '$$comment._id', // Include _id of the comment
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
                            cond: { $eq: ['$$u._id', '$$comment.user'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    _id: '$$matchedUser._id',
                    name: '$$matchedUser.name',
                    profileImage: '$$matchedUser.profileImage',
                    role: '$$matchedUser.role',
                  },
                },
              },
              replies: {
                $map: {
                  input: { $ifNull: ['$$comment.replies', []] },
                  as: 'reply',
                  in: {
                    text: '$$reply.text',
                    user: {
                      $let: {
                        vars: {
                          matchedReplyUser: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$replyUsers',
                                  as: 'ru',
                                  cond: { $eq: ['$$ru._id', '$$reply.user'] },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          _id: '$$matchedReplyUser._id',
                          name: '$$matchedReplyUser.name',
                          profileImage: '$$matchedReplyUser.profileImage',
                          role: '$$matchedReplyUser.role',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        engagement: 0,
        engagementStats: 0,
        commentUsers: 0,
        replyUsers: 0,
      },
    },
  ]);

  if (!posts.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return posts[0];
};





// ✅ Get posts created by a specific user, with total likes/comments
const getMyPosts = async (userId: string) => {

  console.log("Post community ", {userId})
  const posts = await PostCommunity.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(userId),isDeleted: false } },
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
        // totalComments: {
        //   $size: { $ifNull: ['$engagementStats.comments', []] }
        // },
        // Counting comments and replies
        totalComments: {
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            { 
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
                }
              }
            },
          ],
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
        isDeleted: false, 
        creator: { $ne: new mongoose.Types.ObjectId(userId)} // Exclude my own posts
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
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            { 
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
                }
              }
            },
          ],
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
              profileImage: 1,
              role: 1
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
    isDeleted: false, 
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
        $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            { 
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
                }
              }
            },
          ],
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
              role: 1
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
        isDeleted: false, 
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
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            { 
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
                }
              }
            },
          ],
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
        isDeleted: false, 
        creator: { $ne: new mongoose.Types.ObjectId(userId)}
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
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // Count the comments
            { 
              $sum: { // Sum the replies for each comment
                $map: {
                  input: { $ifNull: ['$engagementStats.comments.replies', []] },
                  as: 'reply',
                  in: { $size: { $ifNull: ['$$reply', []] } } // Count replies for each comment
                }
              }
            },
          ],
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
  updatePostCommunityById,
  getAllPosts,
  getPostById,
  getMyPosts,
  getLatestPosts,
  getMostViewedPosts,
  getMostCommentedPosts,
  getSpecificCategoryOrRegionPosts,
  deletePostCommunityById
};
