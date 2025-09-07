import mongoose from 'mongoose';
import Business from '../business/business.model';
import { User } from '../user/user.models';
import UseCredits from './useCredits.model';
import { emitNotificationforGotCredits } from '../../../socketIo';

const createUseCredits = async (payload: {
  userId: string;
  type: 'paymentSubscription' | 'discount' | 'gotCredits';
  businessId?: string;
  usedCredits: number;
  text?: string;
  image?: string;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, type, businessId, text, image } = payload;
    const usedCredits = Number(payload.usedCredits);

    console.log('Payload received:', payload);

    if (isNaN(usedCredits) || usedCredits <= 0) {
      throw new Error('usedCredits must be a positive number');
    }

    // Fetch user and check credits
    const userData = await User.findById(userId).session(session);
    if (!userData) throw new Error('User not found');
    if (userData.totalCredits < usedCredits) throw new Error('Insufficient credits');

    // Deduct credits from user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalCredits: -usedCredits } },
      { new: true, session }
    );

    let authorBusiness: any = null;
    let businessData: any = null
    // Handle discount type
    if (type === 'discount') {
      if (!businessId) throw new Error('businessId is required when type is discount');

      const businessData = await Business.findById(businessId).session(session);
      if (!businessData) throw new Error('Business not found');

      // Add credits to business author
      authorBusiness = await User.findByIdAndUpdate(
        businessData.author,
        { $inc: { totalCredits: usedCredits } },
        { new: true, session }
      );
    }

    // Create UseCredits record
    const credits = await UseCredits.create(
      [
        {
          userId,
          type,
          businessId: type === 'discount' ? businessId : undefined,
          usedCredits,
          text: text || 'Applied discount for booking',
          image: image || '',
        },
      ],
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Define the user message for the coupon notification, including the coupon code (payload.name)
let userMsg = {};

// For 'gotCredits', the message informs the user about receiving credits
userMsg.name = "Credits Received";
userMsg.text = `You received ${usedCredits} credits from the user ${userData.name} for the business "${businessData.name}".`;

// Emit notification for credits usage
emitNotificationforGotCredits({
  userId: userId, 
  receiverId: businessData.author, 
  userMsg: userMsg,  // Pass the properly constructed message object
});

console.log('UseCredits record created:', credits[0]);


    console.log('UseCredits record created:', credits[0]);
    return credits[0];
  } catch (err) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error('Error in createUseCredits (transaction):', err);
    throw err;
  }
};


const getAllUseCredits = async () => {
  return UseCredits.find()
    .populate('userId', 'name email')
    .populate('businessId', 'name logo');
};

const getUseCreditsByUser = async (userId: string) => {
  return UseCredits.find({ userId })
    .populate('businessId', 'name logo')
    .sort({ createdAt: -1 });
};

export const UseCreditsService = {
  createUseCredits,
  getAllUseCredits,
  getUseCreditsByUser,
};
