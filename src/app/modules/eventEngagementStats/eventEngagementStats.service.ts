import EventEngagementStats from './eventEngagementStats.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose from 'mongoose';

const likeEvent = async (eventId: string, userId: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $addToSet: { likes: userId } },
    { upsert: true, new: true }
  );
  return engagement;
};

const unlikeEvent = async (eventId: string, userId: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $pull: { likes: userId } },
    { new: true }
  );
  return engagement;
};

const addComment = async (eventId: string, userId: string, text: string) => {
  const engagement = await EventEngagementStats.findOneAndUpdate(
    { eventId },
    { $push: { comments: { user: userId, text } } },
    { upsert: true, new: true }
  );
  return engagement;
};

const replyCommentofSpecificComment = async (
  eventId: string,
  commentId: string,
  userId: string,
  text: string
) => {

 // Convert eventId and commentId to ObjectId to ensure proper matching
    const eventObjectId = new mongoose.Types.ObjectId(eventId);
    const commentObjectId = new mongoose.Types.ObjectId(commentId);

    console.log({ eventId, commentId, userId, text });

    // Find the EventEngagementStats document first to ensure the comment exists
    const eventEngagementStats = await EventEngagementStats.findOne({
      eventId: eventObjectId,
      'comments._id': commentObjectId, // Ensure the comment exists in the comments array
    });

    if (!eventEngagementStats) {
      throw new Error('Comment not found in the event.');
    }

    // If the comment exists, proceed with updating the reply
    const result = await EventEngagementStats.findOneAndUpdate(
      { 
        eventId: eventObjectId, 
        'comments._id': commentObjectId, // Match the comment by ID within the comments array
      },
      { 
        $push: { 'comments.$.replies': { user: userId, text } }, // Push the reply to the specific comment's replies array
      },
      { upsert: true, new: true } // Create the document if it doesn't exist and return the updated document
    );

    return result; // Return the updated document
};

const getStats = async (eventId: string) => {
  const stats = await EventEngagementStats.findOne({ eventId })
    .populate('likes', 'name email')
    .populate('comments.user', 'name email');

  if (!stats) {
    // throw new AppError(httpStatus.NOT_FOUND, 'No engagement stats found');
    return null
  }

  return stats;
};

const getEventComments = async (eventId: string) => {
  const stats = await EventEngagementStats.findOne({ eventId })
    .select('comments') // only select comments
    .populate('comments.user', 'name profileImage')
    .populate({
      path: 'comments.replies.user', // Populate user data for replies inside comments
      select: 'name profileImage'
    });



  return stats?.comments || [];
};




export const eventEngagementStatsService = {
  likeEvent,
  unlikeEvent,
  addComment,
  getStats,
  replyCommentofSpecificComment,
  getEventComments
};
