import PostCommunity from './postCommunity.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose, { Types } from 'mongoose';
import { UpdatePostCommunityPayload } from './postCommunity.interface';

const createPost = async (payload: any) => {
  const post = await PostCommunity.create(payload);
  if (!post) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create post');
  return post;
};

const updatePostCommunityById = async (
  userId: string,
  postId: string,
  payload: Partial<UpdatePostCommunityPayload> & { deleteGallery?: string[] }
) => {
  // 1️⃣ Fetch existing post
  const existingPost = await PostCommunity.findOne({ _id: postId, creator: userId, isDeleted: false });
  if (!existingPost) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Post not found or you are not authorized');
  }

  // 2️⃣ Prepare updated gallery
  let newGallery = existingPost.gallery || [];

  // Remove images if deleteGallery is provided
  if (payload.deleteGallery && payload.deleteGallery.length > 0) {
    newGallery = newGallery.filter(img => !payload.deleteGallery!.includes(img));
  }

  // Append new images if provided
  if (payload.gallery && payload.gallery.length > 0) {
    newGallery = [...newGallery, ...payload.gallery];
  }

  // Update the gallery in payload
  payload.gallery = newGallery;

  // Remove deleteGallery from payload to avoid saving in DB
  delete payload.deleteGallery;


    // 3️⃣ Update the post
  const updatedPost = await PostCommunity.findOneAndUpdate(
    { _id: postId, creator: userId },
    payload,
    { new: true }
  );
  if (!updatedPost) {   
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update post');  
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

  const posts = await PostCommunity.aggregate([
    { $match: { creator: new mongoose.Types.ObjectId(userId),isDeleted: false } },
    {
      $sort: { createdAt: -1 } // 🔹 descending → latest first
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
const getLatestPosts = async (userId: string | undefined, limit: number = 10) => {
    const matchStage: any = {
    isDeleted: false,
  };

  // 🟢 Apply user-specific filters ONLY if userId exists
  if (userId) {
    matchStage.creator = {
      $ne: new mongoose.Types.ObjectId(userId),
    };

    matchStage.blockedUsers = {
      $ne: new mongoose.Types.ObjectId(userId),
    };
  }

  
  const posts = await PostCommunity.aggregate([
    // Match (guest-safe)
    { $match: matchStage },
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

// const getSpecificCategoryOrRegionPosts = async (
//   userId: string,
//   limit: number = 10,
//   filters?: { category?: string; region?: string }
// ) => {

//   console.log({userId, limit, filters})
//   const matchStage: any = {
//     isDeleted: false, 
//     creator: { $ne: new mongoose.Types.ObjectId(userId) },
//   };

//   if (filters?.category) {
//     const categoryExists = await PostCommunity.exists({ category: filters.category });
//     if (!categoryExists) return [];
//     matchStage.category = filters.category;
//   }

//   if (filters?.region) {
//     matchStage.region = filters.region;
//   }

//   const posts = await PostCommunity.aggregate([
//     { $match: matchStage },
//     { $sort: { createdAt: -1 } },
//     { $limit: limit },
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
//         $add: [
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
//         isLiked: {
//           $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$engagementStats.likes', []] }],
//         },
//       },
//     },
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
//               role: 1
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
//     {
//       $project: {
//         engagement: 0,
//         engagementStats: 0,
//       },
//     },
//   ]);

//   console.log("posts ->>>>> ", posts)

//   return posts;
// };

const getSpecificCategoryOrRegionPosts = async (
  userId: string | undefined,
  limit: number = 10,
  filters?: { category?: string; region?: string }
) => {
  
  const matchStage: any = {
    isDeleted: false,
  };

  // 🟢 Apply user-specific filters ONLY if userId exists
  if (userId) {
    matchStage.creator = {
      $ne: new mongoose.Types.ObjectId(userId),
    };

    matchStage.blockedUsers = {
      $ne: new mongoose.Types.ObjectId(userId),
    };
  }


  if (filters?.category) {
    const categoryExists = await PostCommunity.exists({
      category: filters.category,
    });
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

    // ⭐ lookup engagement stats
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

    // ⭐ add calculated fields
    {
      $addFields: {
        totalLikes: {
          $size: { $ifNull: ['$engagementStats.likes', []] },
        },
        totalComments: {
          $add: [
            { $size: { $ifNull: ['$engagementStats.comments', []] } }, // মূল comment count
            {
              $sum: {
                $map: {
                  input: { $ifNull: ['$engagementStats.comments', []] },
                  as: 'comment',
                  in: { $size: { $ifNull: ['$$comment.replies', []] } }, // প্রতিটি comment এর replies count
                },
              },
            },
          ],
        },
        isLiked: {
          $in: [
            new mongoose.Types.ObjectId(userId),
            { $ifNull: ['$engagementStats.likes', []] },
          ],
        },
      },
    },

    // ⭐ lookup creator info
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
              role: 1,
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

    // ⭐ cleanup
    {
      $project: {
        engagement: 0,
        engagementStats: 0,
      },
    },
  ]);


  return posts;
};



const getMostViewedPosts = async (userId: string | undefined, limit: number = 10) => {
  const matchStage: any = {
    isDeleted: false,
  };

  // 🟢 Apply user-specific filters ONLY if userId exists
  if (userId) {
    matchStage.creator = {
      $ne: new mongoose.Types.ObjectId(userId),
    };

    matchStage.blockedUsers = {
      $ne: new mongoose.Types.ObjectId(userId),
    };
  }

  const posts = await PostCommunity.aggregate([
    { $match: matchStage },

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

const getMostCommentedPosts = async (userId: string | undefined, limit: number = 10) => {

    const matchStage: any = {
    isDeleted: false,
  };

  // 🟢 Apply user-specific filters ONLY if userId exists
  if (userId) {
    matchStage.creator = {
      $ne: new mongoose.Types.ObjectId(userId),
    };

    matchStage.blockedUsers = {
      $ne: new mongoose.Types.ObjectId(userId),
    };
  }

  const posts = await PostCommunity.aggregate([
    //  Match (guest-safe)
    { $match: matchStage },

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



const blockUserForPostCommunity = async (
  postCommunityId: string,
  userId: string
) => {
  if (!Types.ObjectId.isValid(postCommunityId)) {
    throw new Error("Invalid eventId");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  const updatedPostCommunity = await PostCommunity.findByIdAndUpdate(
    postCommunityId,
    {
      $addToSet: { blockedUsers: userId }, // 👈 no duplicate userIds
    },
    { new: true }
  );

  if (!updatedPostCommunity) {
    throw new Error("PostCommunity not found");
  }

  return updatedPostCommunity;
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
  deletePostCommunityById,
  blockUserForPostCommunity
};
