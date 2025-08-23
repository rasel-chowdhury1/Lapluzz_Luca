import PollCommunity from './pollCommunity.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose from 'mongoose';

const createPoll = async (payload: any) => {
  const poll = await PollCommunity.create(payload);
  return poll;
};

const getAllPolls = async (query: Record<string, any>) => {
  const filters: any = { isDeleted: false };
  if (query.category) filters.category = query.category;
  if (query.region) filters.region = query.region;

  return await PollCommunity.find(filters).populate('creator', 'name profileImage email role');
};

const getLatestPolls = async (userId: string) => {
  const polls = await PollCommunity.aggregate([
    {
      $match: {
        isDeleted: false,
        creator: { $ne: new mongoose.Types.ObjectId(userId) } 
      }
    },
    { $sort: { createdAt: -1 } }, // latest first

    // Join with creator info
    {
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creatorInfo'
      }
    },
    { $unwind: '$creatorInfo' },

    // Calculate totalVotes across all options
    {
      $addFields: {
        totalVotes: {
          $sum: {
            $map: {
              input: '$options',
              as: 'opt',
              in: { $size: { $ifNull: ['$$opt.votes', []] } }
            }
          }
        }
      }
    },

    // Rebuild options with voteCount, percentage, isVoted
    {
      $addFields: {
        options: {
          $map: {
            input: '$options',
            as: 'opt',
            in: {
              text: '$$opt.text',
              voteCount: { $size: { $ifNull: ['$$opt.votes', []] } },
              percentage: {
                $cond: [
                  { $gt: ['$totalVotes', 0] },
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: [{ $size: { $ifNull: ['$$opt.votes', []] } }, '$totalVotes'] },
                          100
                        ]
                      },
                      0
                    ]
                  },
                  0
                ]
              },
              isVoted: {
                $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$$opt.votes', []] }]
              }
            }
          }
        }
      }
    },

    // Project the desired structure
    {
      $project: {
        title: 1,
        description: 1,
        category: 1,
        region: 1,
        createdAt: 1,
        options: 1,
        totalVotes: 1,
        creator: {
          _id: '$creatorInfo._id',
          name: '$creatorInfo.name',
          profileImage: '$creatorInfo.profileImage',
          role: '$creatorInfo.role',
        }
      }
    }
  ]);

  return polls;
};

const getMyLatestPolls = async (userId: string) => {
  const polls = await PollCommunity.aggregate([
    {
      $match: {
        isDeleted: false,
        creator: new mongoose.Types.ObjectId(userId) // ✅ only my polls
      }
    },
    { $sort: { createdAt: -1 } },

    // Join with creator info (optional if you want your own profile shown)
    {
      $lookup: {
        from: 'users',
        localField: 'creator',
        foreignField: '_id',
        as: 'creatorInfo'
      }
    },
    { $unwind: '$creatorInfo' },

    // Calculate total votes
    {
      $addFields: {
        totalVotes: {
          $sum: {
            $map: {
              input: '$options',
              as: 'opt',
              in: { $size: { $ifNull: ['$$opt.votes', []] } }
            }
          }
        }
      }
    },

    // Format options
    {
      $addFields: {
        options: {
          $map: {
            input: '$options',
            as: 'opt',
            in: {
              text: '$$opt.text',
              voteCount: { $size: { $ifNull: ['$$opt.votes', []] } },
              percentage: {
                $cond: [
                  { $gt: ['$totalVotes', 0] },
                  {
                    $round: [
                      {
                        $multiply: [
                          { $divide: [{ $size: { $ifNull: ['$$opt.votes', []] } }, '$totalVotes'] },
                          100
                        ]
                      },
                      0
                    ]
                  },
                  0
                ]
              },
              isVoted: {
                $in: [new mongoose.Types.ObjectId(userId), { $ifNull: ['$$opt.votes', []] }]
              }
            }
          }
        }
      }
    },

    // Final shape
    {
      $project: {
        title: 1,
        description: 1,
        category: 1,
        region: 1,
        createdAt: 1,
        options: 1,
        totalVotes: 1,
        creator: {
          _id: '$creatorInfo._id',
          name: '$creatorInfo.name',
          profileImage: '$creatorInfo.profileImage',
          role: '$creatorInfo.role',
        }
      }
    }
  ]);

  return polls;
};

const getPollById = async (pollId: string, userId: string) => {
  const poll = await PollCommunity.findById(pollId).populate('creator', 'name profileImage');

  if (!poll || poll.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Poll not found');
  }

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (opt.votes?.length || 0),
    0
  );

  const options = poll.options.map(opt => {
    const voteCount = opt.votes?.length || 0;
    const isVoted = opt.votes?.some(v => v.toString() === userId.toString());

    return {
      text: opt.text,
      voteCount,
      percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0,
      isVoted
    };
  });

  return {
    _id: poll._id,
    title: poll.title,
    description: poll.description,
    category: poll.category,
    region: poll.region,
    createdAt: poll.createdAt,
    totalVotes,
    options,
    creator: poll.creator
  };
};

export default getPollById;

// const getPollById = async (id: string) => {
//   const poll = await PollCommunity.findById(id).populate('creator', 'name email');
//   if (!poll || poll.isDeleted) throw new AppError(httpStatus.NOT_FOUND, 'Poll not found');
//   return poll;
// };

const votePollOption = async (
  pollId: string,
  optionIndex: number,
  userId: string
) => {
  const poll = await PollCommunity.findById(pollId);
  if (!poll || poll.isDeleted) throw new AppError(httpStatus.NOT_FOUND, 'Poll not found');

  // Check if user has already voted on any option
  const alreadyVoted = poll.options.some((opt) =>
    opt.votes.includes(userId as any)
  );

  if (alreadyVoted) {
    throw new AppError(httpStatus.CONFLICT, 'You have already voted');
  }

  poll.options[optionIndex].votes.push(userId as any);
  await poll.save();
  return poll;
};

const deletePoll = async (id: string) => {
  const poll = await PollCommunity.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  if (!poll) throw new AppError(httpStatus.NOT_FOUND, 'Poll not found');
  return poll;
};

export const pollCommunityService = {
  createPoll,
  getAllPolls,
  getPollById,
  votePollOption,
  deletePoll,
  getLatestPolls,
  getMyLatestPolls
};
