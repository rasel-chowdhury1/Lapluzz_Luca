import catchAsync from '../../utils/catchAsync';
import { Request, Response } from 'express';
import { authServices } from './auth.service';
import sendResponse from '../../utils/sendResponse';

import config from '../../config';
import httpStatus from 'http-status';

// login
const login = catchAsync(async (req: Request, res: Response) => {

  const result = await authServices.login(req.body, req);
  const cookieOptions: any = {
    secure: false,
    httpOnly: true,
    maxAge: 31536000000,
  };

  if (config.NODE_ENV === 'production') {
    cookieOptions.sameSite = 'none';
  }

  res.cookie('refreshToken', refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Logged in successfully',
    data: result,
  });
});

// login by google using {email,name,profileImage}
const googleLogin = catchAsync(async (req: Request, res: Response) => {

  const result = await authServices.googleLogin(req.body, req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Google logged in successfully',
    data: result,
  });
});



// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req?.user;
  const { newPassword, oldPassword } = req.body;

  const result = await authServices.changePassword({
    userId,
    newPassword,
    oldPassword,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  
  const { email } = req.body;

  const result = await authServices.forgotPasswordByEmail(email); 

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'An OTP sent to your email!',
    data: result,
  });
});

// forgot password
const forgotPasswordOtpMatch = catchAsync(
  async (req: Request, res: Response) => {
    const token = req?.headers?.token as string;

    const { otp } = req.body;

    const result = await authServices.forgotPasswordOtpMatch({ otp, token });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Otp match successfully',
      data: result,
    });
  },
);

// reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req?.headers?.token as string;

  const { newPassword, confirmPassword } = req.body;


  const result = await authServices.resetPassword({
    token,
    newPassword,
    confirmPassword,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

// refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // const { refreshToken } = req.cookies;
  const refreshToken = req.headers?.refreshToken as string;
  const result = await authServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

export const authControllers = {
  login,
  googleLogin,
  changePassword,
  forgotPassword,
  forgotPasswordOtpMatch,
  resetPassword,
  refreshToken,
};
