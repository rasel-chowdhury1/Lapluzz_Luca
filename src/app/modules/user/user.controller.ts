import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { userService } from './user.service';

import httpStatus from 'http-status';
import { storeFile } from '../../utils/fileHelper';

const createUser = catchAsync(async (req: Request, res: Response) => {
  console.log(req.body);
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
  const newUser = await userService.otpVerifyAndCreateUser({ otp, token });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User create successfully',
    data: newUser,
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


const getAllUsers = catchAsync(async (req, res) => {
  const { userId } = req.user;
  const result = await userService.getAllUserQuery(userId, req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.result,
    message: 'Users All are requered successful!!',
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
    req.body.profileImage = storeFile('profile', req?.file?.filename);
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

const blockedUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.blockedUser(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User ${result.status ? 'blocked' : 'unBlocked'} successfully`,
    data: result.user,
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

export const userController = {
  createUser,
  userCreateVarification,
  completedProfile,
  getUserById,
  getMyProfile,
  getAdminProfile,
  updateMyProfile,
  blockedUser,
  deleteMyAccount,
  getDashboardOverview,
  getAllUsers,
  getAllUsersOverview,
  getUsersOverview,
  getEarningOverview,
  myReferrals
};
