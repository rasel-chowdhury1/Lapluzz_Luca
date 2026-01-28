/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { emitNotification, emitNotificationOfCreditsEarned, emitNotificationOfSuccessfullyPamentSubcription, notifyUserCreditAdded } from '../../../socketIo';
import QueryBuilder from '../../builder/QueryBuilder';
import config from '../../config';
import { getAdminData, getAdminId } from '../../DB/adminStore';
import { buildLocation } from '../../utils/buildLocation';
import { otpSendEmail, welcomeEmail } from '../../utils/emailNotifiacation';
import { createToken, verifyToken } from '../../utils/tokenManage';
import Event from '../event/event.model';
import Job from '../job/job.model';
import SubscriptionPayment from '../subscriptionPayment/subscriptionPayment.model';
import { DeleteAccountPayload, TUser, TUserCreate, TUserUpdatePayload } from './user.interface';
import { User } from './user.models';
import mongoose, { Types } from 'mongoose';
import Business from '../business/business.model';
import BusinessEngagementStats from '../businessEngaagementStats/businessEngaagementStats.model';
import BusinessReview from '../businessReview/businessReview.model';
import { Request } from 'express';
import { otpServices } from '../otp/otp.service';
import { generateOptAndExpireTime } from '../otp/otp.utils';
import { TPurposeType } from '../otp/otp.interface';
import AppError from '../../error/AppError';
import Otp from '../otp/otp.model';
import { Login_With } from './user.constants';

export type IFilter = {
  searchTerm?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface OTPVerifyAndCreateUserProps {
  otp: string;
  token: string;
}

const createUserToken = async (payload: TUserCreate) => {
  console.log('payload service user =>>> ', payload);

  const {sureName, lastName, name,email,password, role,  phone = "",  dateOfBirth = null, gender, customId, address, longitude, latitude, enableNotification } =
    payload;

  // user exist check
  const userExist = await userService.getUserByEmail(email);

  console.log({userExist})

  if (userExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User already exist!!');
  }

  const { isExist, isExpireOtp } = await otpServices.checkOtpByEmail(email);

  const { otp, expiredAt } = generateOptAndExpireTime(config.otp_expire_time);

  let otpPurpose: TPurposeType = 'email-verification';

  if (isExist && !isExpireOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'otp-exist. Check your email.');
  } else if (isExist && isExpireOtp) {
    const otpUpdateData = {
      otp,
      expiredAt,
    };

    await otpServices.updateOtpByEmail(email, otpUpdateData);
  } else if (!isExist) {
    await otpServices.createOtp({
      name: "Customer",
      sentTo: email,
      receiverType: 'email',
      purpose: otpPurpose,
      otp,
      expiredAt,
    });
  }

  const otpBody: Partial<TUserCreate> = {
    sureName,
    lastName,
    name,
    email,
    password,
    phone,
    dateOfBirth,
    role,
    gender,
    customId,
    address,
    longitude,
    latitude,
    enableNotification,
  };


  // send email
  console.log('before otp send email');
  process.nextTick(async () => {
    await otpSendEmail({
      sentTo: email,
      subject: "Il tuo codice OTP monouso per la verifica dell’email ", // Your one time otp for email  verification
      name: name || "Customer",
      otp,
      purpose: "login",
      expiredAt: expiredAt,
      expireTime: config.otp_expire_time as string || "2"
    });
  });
  console.log('after otp send email==> otp body ==>>> ', otpBody);

  // crete token
  const createUserToken = createToken({
    payload: otpBody,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.otp_token_expire_time as string | number,
  });




  return createUserToken;

};

const otpVerifyAndCreateUser = async (
  { otp, token }: OTPVerifyAndCreateUserProps,
  _req?: Request
) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  // 1) Decode sign-up payload from your short-lived token
  const decoded = verifyToken({
    token,
    access_secret: config.jwt_access_secret as string,
  }) as Partial<{
    password: string;
    email: string;
    role: string;
    sureName: string;
    lastName: string;
    name: string;
    gender?: 'male' | 'female' | 'others' | '';
    phone?: string;
    dateOfBirth?: Date;
    customId?: string; // referrer's customId (your referral code)
    address?: string;
    longitude?: number;
    latitude?: number;
    enableNotification?: boolean;
  }>;

  if (!decoded?.email || !decoded?.password) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorised');
  }

  const {
    password,
    email,
    role,
    sureName,
    lastName,
    name,
    gender,
    phone,
    dateOfBirth,
    customId, // referral code of referrer (maps to User.customId)
    // address, longitude, latitude, enableNotification
  } = decoded;

  // 2) OTP check
  const isOtpMatch = await otpServices.otpMatch(email, otp);

  if (!isOtpMatch) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }

  // mark verified now (await it, don’t nextTick)
  await otpServices.updateOtpByEmail(email, { status: 'verified' });

  // 3) Prevent duplicate
  const existing = await User.isUserExist(email);
  if (existing) {
    throw new AppError(httpStatus.FORBIDDEN, 'User already exists with this email');
  }

try {
  // 4) Create user (password hashing handled by your pre-save hook)
  const user = await User.create({
    sureName,
    lastName,
    name,
    password,
    email,
    role,
    gender,
    phone,
    dateOfBirth: dateOfBirth && !isNaN(new Date(dateOfBirth).getTime()) ? new Date(dateOfBirth) : null
  });

    // 5) Referral logic (transactional): +5 to referrer and +5 to claimant
  if (customId) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const referrer = await User.findOne({ customId }).session(session);
        if (!referrer) return; // invalid code; skip silently

        // block self-referral
        if (referrer._id.toString() === user._id.toString()) {
          throw new AppError(httpStatus.BAD_REQUEST, 'You cannot refer yourself');
        }

        // double-claim guard
        const freshUser = await User.findById(user._id).session(session);
        if (!freshUser) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'User not found after create');
        if (freshUser.referredBy) return; // already referred; skip

        const REWARD = 5;

        // Count BEFORE push to compute “every 3rd referral +2”
        const prevCount = Array.isArray(referrer.referralsUserList)
          ? referrer.referralsUserList.length
          : 0;

        // 5a) Update referrer
        await User.updateOne(
          { _id: referrer._id },
          {
            $addToSet: { referralsUserList: user._id },
            $inc: { totalCredits: REWARD, 'referralStats.earned': REWARD },
          },
          { session }
        );

        const newCount = prevCount + 1;

        if (newCount % 3 === 0) {
          await User.updateOne(
            { _id: referrer._id },
            { $inc: { totalCredits: 2 } },
            { session }
          );
        }

        // 5b) Update claimant (the new user)
        await User.updateOne(
          { _id: user._id },
          {
            $set: { referredBy: referrer._id },
            $inc: { totalCredits: REWARD, 'referralStats.earned': REWARD },
          },
          { session }
        );



        
      // 🔔 Send notifications after credit updates
      const adminData =  getAdminData(); // or your existing admin fetch logic

      
    if (!adminData || !adminData._id) {
      console.error("Admin data not found. Cannot send reminder notifications.");
      return; // Stop the notification process if admin data is not available
    }

      const referrerMsg = {
        name: `🎉 Congratulazioni ${referrer.name || 'Utente'}!`, // 🎉 Congrats ${referrer.name || 'User'}!
        image: adminData?.profileImage ?? '',
        text: `Ciao ${referrer.name}, hai guadagnato +${REWARD} crediti perché ${user.name || 'un utente'} ha utilizzato il tuo codice di referral! ${
newCount % 3 === 0 ? 'Bonus +2 crediti per ogni 3 referral!' : ''
}`, // Hi ${referrer.name}, you earned +${REWARD} credits because ${user.name || 'a user'} has used your referral code! ${newCount % 3 === 0 ? 'Bonus +2 credits for every 3 referrals!' : ''}
      };

      const userMsg = {
        name: `🎉 Benvenuto, ${user.name || 'Utente'}!`, // 🎉 Welcome, ${user.name || 'User'}!
        image: adminData?.profileImage ?? '',
        text: `Ciao ${user.name}, hai guadagnato +${REWARD} crediti utilizzando il codice referral di ${referrer.name || 'un utente'}! Inizia a esplorare Pianofesta!`, // Hi ${user.name}, you earned +${REWARD} credits using ${referrer.name || 'a user'}'s referral code! Start exploring Pianofesta!
      };

      // Fire-and-forget using setImmediate
      setImmediate(async () => {
        try {
          await emitNotificationOfCreditsEarned({
            userId: new mongoose.Types.ObjectId(adminData._id),
            receiverId: new mongoose.Types.ObjectId(referrer._id),
            userMsg: referrerMsg,
          });
        } catch (err) {
          console.error("Failed to send referrer notification:", err);
        }

        try {
          await emitNotificationOfCreditsEarned({
            userId: new mongoose.Types.ObjectId(adminData._id),
            receiverId: new mongoose.Types.ObjectId(user._id),
            userMsg: userMsg,
          });
        } catch (err) {
          console.error("Failed to send user notification:", err);
        }
      });

     
      });



    } finally {
      session.endSession();
    }
  }

  // 6) Issue access token (expiry: organizer 30m, others 15m)
  const isOrganizer = (user.role || '').toString().toLowerCase() === 'organizer';
  const expiryTime = isOrganizer ? '30m' : '15m';

  const jwtPayload = {
    email: user.email,
    userId: user._id.toString(),
    role: user.role,
  };

  const accessToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: expiryTime, // your util uses `expity_time`, keeping as-is
  });





    const notificationData = {
    userId: user?._id,
    receiverId: getAdminId(),
    userMsg: {
      fullName: user.name || "",
      name: user.name || "",
      image: user.profileImage || "", // Placeholder image URL (adjust this)
      text: "New user added in your app"
    },
    type: 'added',
  } as any;

  // Fire-and-forget
  void emitNotification(notificationData);

   // 8) Asynchronously send the welcome email (fire-and-forget)
  process.nextTick(async () => {
    await welcomeEmail({
      sentTo: email,
      subject: '🎉 Benvenuto su Pianofesta!', // 🎉 Welcome to Pianofesta!
      name: name || "Cliente", // Customer
    });
  });

  // 7) EXACT return shape you requested
  return {
    role: user.role,      // e.g., "organizer"
    accessToken,          // JWT string
  };
  // Log or handle the user creation result
  console.log("User created successfully:", user);
} catch (error) {
  // Handle any errors that occur during user creation
  console.error("Error creating user:", error);
  throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create user");
}



};

const adminCreateAdmin = async (userData: {name: string,email:string,password:string, role: string}) => {

  const isExist = await User.isUserExist(userData.email as string);

  if (isExist) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'User already exists with this email',
    );
  }

  const newUserData = {
    name: userData.name,
    password: userData.password,
    email: userData.email,
    role: "super_admin",
    isAdminCreated: true,
    termsAndConditions: true
  };

  const user = await User.create(newUserData);

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User creation failed');
  }

  return user;
};

const updateFcmTokenByUserId = async (userId: string, fcmToken: string) => {

  const user = await User.findByIdAndUpdate(userId, {fcmToken}, { new: true });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User fcmToken update failed');
  }

  return user;
};

const completedUser = async (id: string, payload: Partial<TUser>) => {
  const { role, email, isBlocked, isDeleted, password, longitude, latitude, ...rest } = payload;

  console.log('rest data', rest)

  // Build location if coordinates are provided
  if (longitude !== undefined && latitude !== undefined) {
    rest.location = buildLocation(longitude, latitude)
  }

  const user = await User.findByIdAndUpdate(id, rest, { new: true });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User completing failed');
  }

  console.log({ user })

  return user;
};

const completedBusiness = async (id: string, payload: Partial<TUser>) => {
  const { role, email, isBlocked, isDeleted, password, ...rest } = payload;

  console.log('rest data', rest)

  const user = await User.findByIdAndUpdate(id, rest, { new: true });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User completing failed');
  }

  return user;
};

// const updateUser = async (id: string, payload: TUserUpdatePayload) => {
//   const { role, email, isBlocked, isDeleted, password, dateOfBirth, ...rest } = payload

//   const updateData: Partial<TUser> = { ...rest };

//   if (dateOfBirth === 'null' || dateOfBirth === null || dateOfBirth === undefined) {
//     updateData.dateOfBirth = null;
//   } else {
//     updateData.dateOfBirth = new Date(dateOfBirth);
//   }


//   const user = await User.findByIdAndUpdate(id, updateData, { new: true });

//   if (!user) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'User updating failed');
//   }

//   return user;
// };


const updateUser = async (id: string, payload: TUserUpdatePayload) => {
  const { role, email, isBlocked, isDeleted, password, dateOfBirth, ...rest } = payload;

  // remove empty string fields
  const updateData: Partial<TUser> = Object.fromEntries(
    Object.entries(rest).filter(
      ([_, value]) => value !== '' && value !== undefined
    )
  );

  if (dateOfBirth === 'null' || dateOfBirth === null || dateOfBirth === undefined) {
    updateData.dateOfBirth = null;
  } else if (dateOfBirth) {
    updateData.dateOfBirth = new Date(dateOfBirth);
  }

  const user = await User.findByIdAndUpdate(id, updateData, { new: true });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User updating failed');
  }

  return user;
};

// ............................rest

const getAllUserQuery = async (userId: string, query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find({ _id: { $ne: userId }, role: 'user' }), query)
    .search(['name', 'sureName', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const getAllUserList = async () => {
  const users = await User.find({ role: 'user', isDeleted: false });
  return users;
};



const getAllUserQueryNameList = async (userId: string, query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find({ _id: { $ne: userId }, isDeleted: false}).select("name sureName email role") as any, query)
    .search(['name', 'sureName', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();
  return { meta, result };
};

const getAllUserNameList = async (userId: string, query: Record<string, unknown>) => {

  const result = await User.find({ _id: { $ne: userId }, isDeleted: false}).select("name sureName email")
  return result;
  
};


const getAllUserCount = async () => {
  const allUserCount = await User.countDocuments();
  return allUserCount;
};

const getUsersOverview = async (userId: string, year: number, role: 'user' | 'organizer') => {
  try {
    // Step 1: Fetch user growth data from MongoDB
    const userOverviewData = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
          role: role,
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 2: Define all months
    const allMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Step 3: Create a full month data array, filling with 0s if not present in aggregation
    const userOverview = allMonths.map((monthName, index) => {
      const monthIndex = index + 1;
      const found = userOverviewData.find(item => item._id === monthIndex);
      return {
        _id: monthIndex,
        count: found ? found.count : 0,
        monthName,
      };
    });

    return { userOverview };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw new Error('Error fetching dashboard data.');
  }
};


const getBusinessUserList = async () => {
  // Step 1: Get all users with organizer role
  const users = await User.find({ role: 'organizer' }).lean();

  const result = await Promise.all(
    users.map(async (user) => {
      const userId = new Types.ObjectId(user._id);

      // Get all businesses owned by this user
      const businesses = await Business.find({ author: userId }).lean();
      const totalBusiness = businesses.length;

      // Try to get parent business if exists
      const parentBusiness = user.parentBusiness
        ? await Business.findById(user.parentBusiness).lean()
        : null;

      const totalSupportedServices = parentBusiness?.supportedServices?.length || 0;
      const totalAdditionalServices = parentBusiness?.additionalServices?.length || 0;
      const activeSponsorship = parentBusiness?.subscriptionType || 'none';

      // Count active sponsorships from business list
      const now = new Date();
      const totalActiveSponsorship = businesses.filter(
        b =>
          b.subscriptionType !== 'none' &&
          b.expireSubscriptionTime &&
          new Date((b as any).expireSubscriptionTime) > now
      ).length;

      // Count events and jobs
      const [totalEvent, totalJob] = await Promise.all([
        Event.countDocuments({ author: userId }),
        Job.countDocuments({ author: userId }),
      ]);

      // Engagement stats for parent business
      const engagementStats = parentBusiness
        ? await BusinessEngagementStats.findOne({ businessId: parentBusiness._id }).lean()
        : null;

      const totalFollowers = engagementStats?.followers?.length || 0;
      const totalLikes = engagementStats?.likes?.length || 0;

      // Total reviews
      const totalReviews = parentBusiness
        ? await BusinessReview.countDocuments({ businessId: parentBusiness._id })
        : 0;

      return {
        userId: user._id,
        customId: user.customId,
        name: user.name || 'Unknown',
        lastName: user.lastName || 'Unknown',
        sureName: user.sureName || 'Unknown',
        email: user.email || "Unknown",
        activeSponsorship,
        totalBusiness,
        totalEvent,
        totalJob,
        totalCredit: user.totalCredits || 0,
        totalFollowers,
        totalLikes,
        totalReviews,
        totalSupportedServices,
        totalAdditionalServices,
        totalActiveSponsorship,
        parentBusiness: user.parentBusiness,
        createdAt: user.createdAt,
      };
    })
  );

  return result;
};



const dashboardOverview = async (userId: string) => {
  // User stats
  const totalUsers = await User.countDocuments({ _id: { $ne: userId } });
  const totalRegularUsers = await User.countDocuments({ _id: { $ne: userId }, role: 'user' });
  const totalBusinessUsers = await User.countDocuments({ _id: { $ne: userId }, role: 'organizer' });

  const recentUsers = await User.find({ _id: { $ne: userId } })
    .sort({ createdAt: -1 })
    .limit(6)
    .select("sureName name about email gender phone createdAt dateOfBirth profileImage device isBlocked isDeleted");

  // Job & Event stats
  const totalEvents = await Event.countDocuments({ isDeleted: false });
  const totalActiveJobs = await Job.countDocuments({ isActive: true, isDeleted: false });

  // Revenue from activated subscriptions
  const revenueResult = await SubscriptionPayment.aggregate([
    { $match: { status: 'activate' } },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;

  return {
    totalUsers,
    totalRegularUsers,
    totalBusinessUsers,
    totalEvents,
    totalActiveJobs,
    totalRevenue,
    recentUsers,
  };
};




const getAllUsersOverview = async (userId: string, year: any) => {
  try {
    // Fetch total user count
    const totalUsers = await User.countDocuments();

    // Fetch user growth over time for the specified year (monthly count with month name)
    const userOverview = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }, // Filter by year
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' }, // Group by month of the 'createdAt' date
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "January" },
                { case: { $eq: ["$_id", 2] }, then: "February" },
                { case: { $eq: ["$_id", 3] }, then: "March" },
                { case: { $eq: ["$_id", 4] }, then: "April" },
                { case: { $eq: ["$_id", 5] }, then: "May" },
                { case: { $eq: ["$_id", 6] }, then: "June" },
                { case: { $eq: ["$_id", 7] }, then: "July" },
                { case: { $eq: ["$_id", 8] }, then: "August" },
                { case: { $eq: ["$_id", 9] }, then: "September" },
                { case: { $eq: ["$_id", 10] }, then: "October" },
                { case: { $eq: ["$_id", 11] }, then: "November" },
                { case: { $eq: ["$_id", 12] }, then: "December" },
              ],
              default: "Unknown", // Default value in case month is not valid
            },
          },
        },
      },
      { $sort: { _id: 1 } }, // Sort by month (ascending)
    ]);

    // Fetch recent users
    const recentUsers = await User.find({ _id: { $ne: userId } }).sort({ createdAt: -1 }).limit(6);

    return {
      totalUsers,
      userOverview, // Includes month names with user counts
      recentUsers,
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw new Error('Error fetching dashboard data.');
  }
};



const getUserById = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  return result;
};




// Optimized the function to improve performance, reducing the processing time to 235 milliseconds.
const getMyProfile = async (id: string) => {

  const userData = await User.findById(id).lean();


  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }



  return userData;
};



const getAdminProfile = async (id: string) => {
  const result = await User.findById(id).lean()

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }


  return result;
};

const getUserByEmail = async (email: string) => {
  const result = await User.findOne({ email });
  console.log("result ->>> ", result)
  return result;
};

const deleteMyAccount = async (id: string, payload: DeleteAccountPayload) => {
  const user: TUser | null = await User.IsUserExistById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user?.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
  }

  if (!(await User.isPasswordMatched(payload.password, user.password))) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  // Hard delete the user
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User deletion failed');
  }

  // Use deleteMany to remove OTPs sent to the deleted user's email
  const otpDeleted = await Otp.findOneAndDelete({ sentTo: deletedUser.email });

  return null;
};



const deleteGoogleAccountWithOtp = async (userId: string, payload: 
  {
    otp: string;
  }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is already deleted');
  }

  if (user.loginWth !== Login_With.google) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP deletion is only for Google accounts');
  }

  // Verify OTP
  const otpDoc = await Otp.findOne({
    sentTo: user.email,
    purpose: 'delete-account',
    status: 'pending',
  });

  if (!otpDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'No OTP found. Please request a new one.');
  }

  const now = new Date();

  if (otpDoc.expiredAt < now) {
    // OTP expired → delete it
    await Otp.deleteOne({ _id: otpDoc._id });
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired. Please request a new one.');
  }

  if (otpDoc.otp !== payload.otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP.');
  }

  // ✅ Delete OTP after successful verification
  await Otp.deleteOne({ _id: otpDoc._id });

  // Delete user
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User deletion failed');
  }

  // Delete any remaining OTPs for safety
  await Otp.deleteMany({ sentTo: deletedUser.email });

  return null;
};


const deleteSuperAdmin = async (id: string) => {
  const user: TUser | null = await User.IsUserExistById(id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete the user');
  }
  // Use deleteMany to remove OTPs sent to the deleted user's email
  const otpDeleted = await Otp.deleteMany({ sentTo: deletedUser.email });

  return deletedUser;
};

const blockedUser = async (id: string) => {
  const singleUser = await User.IsUserExistById(id);

  if (!singleUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // let status;

  // if (singleUser?.isActive) {
  //   status = false;
  // } else {
  //   status = true;
  // }
  let status = !singleUser.isBlocked;
  console.log('status', status);
  const user = await User.findByIdAndUpdate(
    id,
    { isBlocked: status },
    { new: true },
  );

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'user blocking failed');
  }

  return { status, user };
};


// const deletedUser = async (id: string) => {
//   const singleUser = await User.IsUserExistById(id);

//   if (!singleUser) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   // let status;

//   // if (singleUser?.isActive) {
//   //   status = false;
//   // } else {
//   //   status = true;
//   // }
//   // let status = !singleUser.isDeleted;
//   // console.log('status', status);
//   // const user = await User.findByIdAndUpdate(
//   //   id,
//   //   { isDeleted: status },
//   //   { new: true },
//   // );

//     // Hard delete the user
//   const deletedUser = await User.findByIdAndDelete(id);

//   if (!deletedUser) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'User deletion failed');
//   }


//   return null;

// };

const deletedUser = async (id: string) => {
  // Check if the user exists by their ID
  const singleUser = await User.IsUserExistById(id);

  if (!singleUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Hard delete the user
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User deletion failed');
  }

  // Assuming user has an email field, you should use the deleted user's email
  const otpDeleted = await Otp.deleteMany({ sentTo: deletedUser.email });

  // Check if OTPs were deleted successfully
  if (!otpDeleted) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to delete OTPs');
  }

  // Return a success message or the deleted user's data for further processing
  return {
    message: 'User and OTPs deleted successfully',
    deletedUser,
  };
};

const getEarningOverview = async (year: number) => {
  console.log({ year });

  // Step 1: Aggregate payments by month for the given year
  const earningsData = await SubscriptionPayment.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
        status: { $in: ['pending', 'notActivate', 'success', 'activate', 'gotCredits'] },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Step 2: Map all months to ensure each one is present
  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthlyEarnings = allMonths.map((monthName, index) => {
    const monthNumber = index + 1;
    const matched = earningsData.find(item => item._id === monthNumber);
    return {
      _id: monthNumber,
      monthName,
      totalRevenue: matched ? matched.totalAmount : 0, // <-- corrected here
      paymentCount: matched ? matched.count : 0,
    };
  });

  return { monthlyEarnings };
};

const myReferrals = async (userId: string) => {
  const isExistUser = await User.findById(userId);

  return {
    friendsInvited: isExistUser?.referralsUserList.length,
    creditsEarned: isExistUser?.totalCredits,
    customId: isExistUser?.customId
  }
}


const getMyTotalCredits = async (userId: string) => {
  const totalCredits = await User.findById(userId).select("totalCredits");

  return totalCredits;
};

const addCreditsByAdmin = async (adminId: string, userId: string, creditAmount: number, image:string) => {
  const result = await User.findByIdAndUpdate(
    userId,
    { $inc: { totalCredits: creditAmount } }, // Increment totalCredits by creditAmount
    { new: true } // Return the updated document
  );

  if (!result) {
    throw new Error("User not found");
  }

  let message = {
    image: image,
    name: "Pianofesta Support",
    text: `Hello, ${creditAmount} credits were successfully added to your account by the administrator. You can now use them for your activities on Pianofesta.`
  };

  notifyUserCreditAdded({
    userId: new mongoose.Types.ObjectId(adminId),
    receiverId: new mongoose.Types.ObjectId(userId),
    userMsg: message
  })
  return result;
};

const getAdminList = async (userId: string) => {
  const adminList = await User.find({
    _id: { $ne: userId },
    role: { $in: ['admin', 'super_admin'] },
    isBlocked: false,
    isDeleted: false,
  }).select("name email profileImage role createdAt");

  console.log(adminList)
  return adminList;
};


export const userService = {
  createUserToken,
  otpVerifyAndCreateUser,
  completedUser,
  getMyProfile,
  getAdminProfile,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteMyAccount,
  deletedUser,
  blockedUser,
  getAllUserQuery,
  getAllUserCount,
  dashboardOverview,
  getUsersOverview,
  getAllUserQueryNameList,
  getAllUsersOverview,
  getEarningOverview,
  myReferrals,
  getAllUserList,
  getBusinessUserList,
  adminCreateAdmin,
  getAdminList,
  getMyTotalCredits,
  deleteSuperAdmin,
  updateFcmTokenByUserId,
  addCreditsByAdmin,
  deleteGoogleAccountWithOtp
};
