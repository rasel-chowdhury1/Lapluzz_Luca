import catchAsync from '../../utils/catchAsync';
import { otpServices } from './otp.service';
import sendResponse from '../../utils/sendResponse';
import { Request, Response } from 'express';
import httpStatus from 'http-status';

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers?.token as string;

  console.log({ token });

  await otpServices.resendOtpEmail({ token });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP Resent successfully',
    data: {},
  });
});

const sendDeleteAccountOtpForGoogleAndApple = catchAsync(
  async (req, res) => {
    const {userId} = req.user;

    await otpServices.sendDeleteAccountOtpForGoogleAndApple(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'OTP inviato alla tua email',
      data: null,
    });
  },
);

export const otpControllers = {
  resendOtp,
  sendDeleteAccountOtpForGoogleAndApple
};
