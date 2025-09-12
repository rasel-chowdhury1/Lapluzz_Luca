import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';
import fs, { access } from 'fs';
import httpStatus from 'http-status';
import { storeFile } from '../../utils/fileHelper';
import { uploadFileToS3 } from '../../utils/fileUploadS3';

const createUser = catchAsync(async (req: Request, res: Response) => {
  console.log("create user data =>>>> ",req.body);
  const createUserToken = await userService.createUserToken(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Check email for OTP',
    data: createUserToken,
  });
});

const userCreateVarification = catchAsync(async (req, res) => {
  console.log('..........1..........');
  const token = req.headers?.token as string;
  console.log('token', token);
  const { otp } = req.body;
  console.log('otp', otp);
  const newUser = await userService.otpVerifyAndCreateUser({ otp, token }, req);

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User create successfully',
    data: newUser,
  });
});

const updatefcmToken = catchAsync(async (req: Request, res: Response) => {

  const {fcmToken} = req.body;

   await userService.updateFcmTokenByUserId(req?.user?.userId, fcmToken);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'profile completed successfully',
    data: null,
  });
});


const completedProfile = catchAsync(async (req: Request, res: Response) => {

  const result = await userService.completedUser(req?.user?.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'profile completed successfully',
    data: result,
  });
});

// rest >...............


const getAllUsersList = catchAsync(async (req, res) => {
  const result = await userService.getAllUserList();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All user feteched successful!!',
  });
});

const getAllBusinessUsers = catchAsync(async (req, res) => {
  const result = await userService.getBusinessUserList();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    data: result,
    message: 'All business users are requered successful!!',
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User fetched successfully',
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {

  console.log("get my profile ->>> ", req?.user?.userId)
  const result = await userService.getMyProfile(req?.user?.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'profile fetched successfully',
    data: result,
  });
});

const getAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAdminProfile(req?.user?.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'profile fetched successfully',
    data: result,
  });
});

const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {

  const result = await userService.dashboardOverview(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard overview fetched successfully',
    data: result,
  });
});


const getUsersOverview = catchAsync(async (req, res) => {
  console.log("get all user overview _>>>>");

  const { userId } = req.user;

  // Get year or default to current year
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

  // Validate role with fallback to 'user'
  const role = (req.query.role === 'organizer' || req.query.role === 'user') ? req.query.role : 'user';

  // Check for valid year
  if (isNaN(year)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid year parameter.',
      data: null,
    });
  }


  console.log({ userId, year, role })

  // Fetch data from service
  const result = await userService.getUsersOverview(userId, year, role);

  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User overview fetched successfully',
    data: result,
  });
});


const getAllUserQueryNameList = catchAsync(async (req, res) => {

  const { userId } = req.user;



  // Fetch data from service
  const result = await userService.getAllUserQueryNameList(userId, req.query);

  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User overview fetched successfully',
    data: result,
  });
});

const getAllUsersOverview = catchAsync(async (req, res) => {
  console.log("get all user overviewo _>>>> ");
  const { userId } = req.user;
  // Default to the current year if the 'year' query parameter is not provided
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

  // Ensure the year is valid
  if (isNaN(year)) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid year parameter.',
      data: null,
    });
  }

  const result = await userService.getAllUsersOverview(userId, year)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'get all User overview fetched successfully',
    data: result,
  });
});




const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  if (req?.file) {
    // req.body.profileImage = storeFile('profile', req?.file?.filename);

        // upload file in bucket function is done
    try {
      const data = await uploadFileToS3(req.file)


      console.log("data----->>>> ",data)
      // deleting file after upload
      fs.unlinkSync(req.file.path)
  
      req.body.profileImage = data.Location;
    } catch (error) {
      console.log("====erro9r --->>> ", error)
      if(fs.existsSync(req.file.path)){
        fs.unlinkSync(req.file.path)
      }
    }

  }
  // console.log('file', req?.file);
  // console.log('body data', req.body);

  console.log(req.headers.authorization)

  const result = await userService.updateUser(req?.user?.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'profile updated successfully',
    data: result,
  });
});

const myReferrals = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await userService.myReferrals(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `My referrals fetched successfully`,
    data: result,
  });
});

const addCreditsByAdmin = catchAsync(async (req: Request, res: Response) => {

  const {userId: adminId, profileImage} = req.user;
  const { userId, creditAmount } = req.body;

  if (!userId || creditAmount == null) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "userId and creditAmount are required",
      data: null,
    });
  }

  const updatedUser = await userService.addCreditsByAdmin(adminId,userId, creditAmount,profileImage);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Added ${creditAmount} credits to user successfully`,
    data: updatedUser,
  });
});


const blockedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.blockedUser(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User ${result.status ? 'blocked' : 'unBlocked'} successfully`,
    data: result.user,
  });
});

const deletedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.deletedUser(req.params.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User deleted successfully`,
    data: null,
  });
});

const deleteMyAccount = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.deleteMyAccount(req.user?.userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

const deleteSuperAdmin = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await userService.deleteSuperAdmin(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Super admin deleted successfully',
    data: null,
  });
});

const getEarningOverview = catchAsync(async (req: Request, res: Response) => {
  const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

  if (isNaN(year)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid year parameter.',
      data: null,
    });
  }

  const result = await userService.getEarningOverview(year);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Earning overview fetched successfully',
    data: result,
  });
});

const adminCreateAdmin = catchAsync(async (req: Request, res: Response) => {
 
  if (!req.body.role) {
    req.body.role = "super_admin"
  }
  const result = await userService.adminCreateAdmin(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin created successfully',
    data: result ,
  });
});

const getMyTotalCredits = catchAsync(async (req: Request, res: Response) => {
  const {userId} = req.user;
  const result = await userService.getMyTotalCredits(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My total credits fetched successfully',
    data: result ,
  });
});

const getSuperAdminLists = catchAsync(async (req: Request, res: Response) => {
 
  const result = await userService.getAdminList(req.user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admins fetched successfully',
    data: result ,
  });
});

export const userController = {
  createUser,
  userCreateVarification,
  completedProfile,
  getUserById,
  getMyProfile,
  getAdminProfile,
  updateMyProfile,
  deletedUser,
  blockedUser,
  deleteMyAccount,
  getDashboardOverview,
  getAllUsersList,
  getAllBusinessUsers,
  getAllUsersOverview,
  getUsersOverview,
  getEarningOverview,
  myReferrals,
  adminCreateAdmin,
  getSuperAdminLists,
  deleteSuperAdmin,
  getAllUserQueryNameList,
  getMyTotalCredits,
  updatefcmToken,
  addCreditsByAdmin
};
