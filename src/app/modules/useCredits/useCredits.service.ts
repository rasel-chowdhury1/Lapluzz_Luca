import mongoose from 'mongoose';
import Business from '../business/business.model';
import { User } from '../user/user.models';
import UseCredits from './useCredits.model';
import { emitNotificationforGotCredits, emitNotificationforPendingCredits, emitNotificationforRejectCredits } from '../../../socketIo';
import config from '../../config';
// const createUseCredits = async (payload: {
//   userId: string;
//   type: 'paymentSubscription' | 'discount' | 'gotCredits';
//   businessId?: string;
//   usedCredits: number;
//   text?: string;
//   image?: string;
// }) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { userId, type, businessId, text, image } = payload;
//     const usedCredits = Number(payload.usedCredits);

//     console.log('Payload received:', payload);

//     if (isNaN(usedCredits) || usedCredits <= 0) {
//       throw new Error('usedCredits must be a positive number');
//     }

//     // Fetch user and check credits
//     const userData = await User.findById(userId).session(session);
//     if (!userData) throw new Error('User not found');
//     if (userData.totalCredits < usedCredits) throw new Error('Insufficient credits');

//     // Deduct credits from user
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $inc: { totalCredits: -usedCredits } },
//       { new: true, session }
//     );

//     let authorBusiness: any = null;

//     // Handle discount type
//     if (type === 'discount') {
//       if (!businessId) throw new Error('businessId is required when type is discount');

//       const businessData = await Business.findById(businessId).session(session);
//       if (!businessData) throw new Error('Business not found');

//       // Add credits to business author
//       authorBusiness = await User.findByIdAndUpdate(
//         businessData.author,
//         { $inc: { totalCredits: usedCredits } },
//         { new: true, session }
//       );

//           // Define the user message for the coupon notification, including the coupon code (payload.name)
//     let userMsg = {};

//     // For 'gotCredits', the message informs the user about receiving credits
//     (userMsg as any).name = "Credits Received";
//     (userMsg as any).text = `You received ${usedCredits} credits from the user ${userData.name} for the business "${businessData?.name}".`;
//     (userMsg as any).image = config.credits_recived_img

//     // Emit notification for credits usage
//     emitNotificationforGotCredits({
//       userId: userId as any, 
//       receiverId: businessData?.author as any, 
//       userMsg: userMsg as any,  // Pass the properly constructed message object
//     });

//     }

//     // Create UseCredits record
//     const credits = await UseCredits.create(
//       [
//         {
//           userId,
//           type,
//           businessId: type === 'discount' ? businessId : undefined,
//           usedCredits,
//           text: text || 'Applied discount for booking',
//           image: image || '',
//         },
//       ],
//       { session }
//     );




//     // Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     console.log('UseCredits record created:', credits[0]);
//     return credits[0];
//   } catch (err) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     session.endSession();
//     console.error('Error in createUseCredits (transaction):', err);
//     throw err;
//   }
// };


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
    if (isNaN(usedCredits) || usedCredits <= 0) {
      throw new Error('usedCredits must be a positive number');
    }

    const userData = await User.findById(userId).session(session);
    if (!userData) throw new Error('User not found');

    if (userData.totalCredits < usedCredits) {
      throw new Error('Insufficient credits');
    }

    let businessData = null;

    if (type === 'discount') {
      if (!businessId) throw new Error('businessId is required for discount');

      businessData = await Business.findById(businessId).session(session);
      if (!businessData) throw new Error('Business not found');
    }

    // ✅ Create UseCredits record (PENDING)
    const credits = await UseCredits.create(
      [
        {
          userId,
          type,
          businessOwner: businessData?.author,
          businessId: type === 'discount' ? businessId : undefined,
          usedCredits,
          text: text || 'Pending credit use request',
          image: image || '',
          status: 'pending',
        },
      ],
      { session }
    );

    // ✅ Prepare notification payload
    const userMsg: any = {};
    userMsg.name = "Credits Approval Request";
    userMsg.text = `${userData.name} requested to use ${usedCredits} credits for your business "${businessData?.name}". Please review and approve.`;
    userMsg.image = config.credits_recived_img; // pending icon/image
    userMsg.notificationFor = credits[0]._id; // store request id for reference

    // ✅ Notify business owner
    if (type === 'discount') {
      emitNotificationforPendingCredits({
        userId: userId as any,
        receiverId: businessData?.author as any,
        message: userMsg,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return credits[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};


const acceptCreditsRequest = async (creditsRequestId: string) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await UseCredits.findById(creditsRequestId)
      .populate("userId")
      .populate("businessId")
      .session(session) as any;

    if (!request) throw new Error("Credit request not found");
    if (request.type !== "discount") throw new Error("Invalid request type");
    if (request.status !== "pending") throw new Error("Request already processed");

    const userId = request.userId._id;
    const businessOwnerId = request?.businessId?.author;

    const usedCredits = Number(request.usedCredits);

    if (isNaN(usedCredits) || usedCredits <= 0) {
      throw new Error("usedCredits must be a positive number");
    }

    // ✅ Check user credits
    const userData = await User.findById(userId).session(session);

    if (!userData) throw new Error("User not found");

    if (userData.totalCredits < usedCredits) {
      throw new Error("Insufficient credits");
    }

    // ✅ Deduct from user using findByIdAndUpdate
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalCredits: -usedCredits } },
      { new: true, session }
    );

    if (!updatedUser) throw new Error("Failed to deduct credits from user");

    // ✅ Add to business owner using findByIdAndUpdate
    const updatedBusinessOwner = await User.findByIdAndUpdate(
      businessOwnerId,
      { $inc: { totalCredits: usedCredits } },
      { new: true, session }
    );

    if (!updatedBusinessOwner) throw new Error("Failed to credit business owner");

    // ✅ Update request status
    await UseCredits.findByIdAndUpdate(
      creditsRequestId,
      { status: "accepted" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ Notification
    const userMsg: any = {};
    userMsg.name = "Credits Request Approved";
    userMsg.text = `Your request to use ${usedCredits} credits has been approved.`;
    userMsg.image = config.credits_recived_img;

    emitNotificationforGotCredits({
      userId: businessOwnerId,
      receiverId: userId,
      userMsg
    });

    return { success: true, message: "Credits request approved successfully" };

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};




const rejectCreditsRequest = async (creditsRequestId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await UseCredits.findById(creditsRequestId)
      .populate("userId")
      .populate("businessId")
      .session(session) as any;

    if (!request) throw new Error("Credit request not found");
    
    if (request.status !== "pending") throw new Error("Request already processed");

    const userId = request.userId._id;
    if (!request.businessId) {
        throw new Error("Business not found in the credit request");
      }
    const businessOwnerId = request.businessId.author;

    // Update request status to rejected
    await UseCredits.findByIdAndUpdate(
      creditsRequestId,
      { status: "rejected" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Notification payload
    const userMsg: any = {};
    userMsg.name = "Credits Request Rejected";
    userMsg.text = `Your request to use credits at "${request.businessId?.name}" was rejected.`;
    userMsg.image = config.credits_recived_img;

    // ✅ Emit rejection notification
    emitNotificationforRejectCredits({
      userId: businessOwnerId,
      receiverId: userId as any,
      message: userMsg,
    });

    return { success: true, message: "Credits request rejected successfully" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};



const getPendingCreditsRequestsOfUser = async (userId: string) => {
  
  return UseCredits.find({ userId, status: "pending" })
     .populate("businessOwner", "name email")
    .populate('businessId', 'name logo')
    .sort({ createdAt: -1 }) || [];
}

const getPendingCreditsRequestsOfBusiness = async (userId: string) => {

  return UseCredits.find({ businessOwner: userId, status: "pending" })
     .populate("userId", "name email")
     .populate("businessOwner", "name email")
    .populate('businessId', 'name logo')
    .sort({ createdAt: -1 }) || [];
}

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

const getMyCredits = async (userId: string, role: string) => {
  let filter: any = {
    status: { $in: ["approved", "rejected"] } // ✅ only approved + rejected
  };

  if (role === "user") {
    filter.userId = userId;
    filter.type = "discount";
  } 
  else if (role === "business") {
    filter.businessOwner = userId;
    filter.type = "discount"; 
  }

  const credits = await UseCredits.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "name email profileImage")
    .populate("businessId", "name logo coverImage");

  return credits;
};

export const UseCreditsService = {
  createUseCredits,
  getAllUseCredits,
  getUseCreditsByUser,
  acceptCreditsRequest,
  rejectCreditsRequest,
  getPendingCreditsRequestsOfUser,
  getPendingCreditsRequestsOfBusiness,
  getMyCredits
};
