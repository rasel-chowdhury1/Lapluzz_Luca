import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import config from '../../config';
import { otpSendEmail } from '../../utils/emailNotifiacation';
import { createToken, verifyToken } from '../../utils/tokenManage';
import { TUser } from '../user/user.interface';
import { User } from '../user/user.models';
import { OTPVerifyAndCreateUserProps } from '../user/user.service';
import { TLogin } from './auth.interface';
import { Request } from 'express';
import UAParser from 'ua-parser-js';
import { Login_With, USER_ROLE } from '../user/user.constants';
import { generateAndReturnTokens } from '../user/user.utils';
import AppError from '../../error/AppError';
import { otpServices } from '../otp/otp.service';
import { generateOptAndExpireTime } from '../otp/otp.utils';
import Otp from '../otp/otp.model';
// Login
const login = async ( payload: TLogin, req: Request) => {
  const user = await User.isUserActive(payload?.email);
  
  
  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  if (!(await User.isPasswordMatched(payload.password, user.password))) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  const jwtPayload: {
    userId: string;
    role: string;
    fullName?: string;
    email: string;
    phone?: string;
    profileImage?: string;
  } = {
    fullName: user?.name,
    email: user.email,
    phone: user.phone,
    userId: user?._id?.toString() as string,
    role: user?.role,
    profileImage: user?.profileImage
  };


  if (user) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';
     
    const userAgent = req.headers['user-agent'] || '';
    //@ts-ignore
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const device = {
      ip: ip,
      browser: result.browser.name,
      os: result.os.name,
      device: result.device.model || 'Desktop',
      lastLogin: new Date().toISOString(),
    };

    await User.findByIdAndUpdate(
      user?._id,
      { device },
      { new: true, upsert: false },
    );
  }


  const accessToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.jwt_access_expires_in as string,
  });


  const refreshToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_refresh_secret as string,
    expity_time: config.jwt_refresh_expires_in as string,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const googleLogin = async (payload: { email: string, name: string, profileImage: string, role: string }, req: Request) => {
  // Check if the user exists
  let user = await User.isUserExist(payload.email);

  

  if (user) {
    // Validate user status and permissions
    if (user.loginWth !== Login_With.google) throw new AppError(httpStatus.FORBIDDEN, `This account is not registered with Google login. Try logging in with ${user.loginWth}`);
    if (user.isDeleted) throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted');
    if (user.isBlocked) throw new AppError(httpStatus.FORBIDDEN, 'User account is blocked');

     const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';
     
    const userAgent = req.headers['user-agent'] || '';
    //@ts-ignore
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const device = {
      ip: ip,
      browser: result.browser.name,
      os: result.os.name,
      device: result.device.model || 'Desktop',
      lastLogin: new Date().toISOString(),
    };

    await User.findByIdAndUpdate(
      user?._id,
      { device },
      { new: true, upsert: false },
    );

    return generateAndReturnTokens(user);
  }


try {
    // If user does not exist, create a new one
  user = await User.create({
    fullName: payload?.name || "",
    email: payload.email,
    password: "testing123",
    profileImage: payload?.profileImage || "",
    role: payload.role || USER_ROLE.USER,
    loginWth: Login_With.google,
  });
} catch (error) {
  console.log({error});
  return;
}

 

   const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '';
     
    const userAgent = req.headers['user-agent'] || '';
    //@ts-ignore
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const device = {
      ip: ip,
      browser: result.browser.name,
      os: result.os.name,
      device: result.device.model || 'Desktop',
      lastLogin: new Date().toISOString(),
    };

    await User.findByIdAndUpdate(
      user?._id,
      { device },
      { new: true, upsert: false },
    );


  return generateAndReturnTokens(user);
};




// forgot Password by email
const forgotPasswordByEmail = async (email: string) => {
  const user: TUser | null = await User.isUserActive(email);

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const { isExist, isExpireOtp } = await otpServices.checkOtpByEmail(email);

  const { otp, expiredAt } = generateOptAndExpireTime("5");

  if (isExist && !isExpireOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'otp-exist. Check your email.');
  } else if (isExist && isExpireOtp) {
    const otpUpdateData = {
      otp,
      expiredAt,
      status: 'pending',
    };

    await otpServices.updateOtpByEmail(email, otpUpdateData);
  }
  else{
    const otpUpdateData = {
      sentTo: email,
      receiverType: "email",     
      purpose:"email-verification",
      otp,
      expiredAt,
      status: 'pending',
    };

    await Otp.create(otpUpdateData)
  }

  const jwtPayload = {
    email: email,
    userId: user?._id,
  };

  const forgetToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.otp_token_expire_time as string | number,
  });

  process.nextTick(async () => {
    await otpSendEmail({
      sentTo: email,
      subject: 'Your one time otp for forget password',
      name: '',
      otp,
      expiredAt: expiredAt,
      expireTime: "5"
    });
  });

  return { forgetToken };
};

// forgot Password by number
// const forgotPasswordByNumber = async (phoneNumber: string) => {
//   if (!phoneNumber) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'phone number is required');
//   }


//   // Generate a random 6-digit OTP
//   const otp = Math.floor(100000 + Math.random() * 900000);

//   try {
//     // // Send the SMS
//     await client.messages.create({
//       body: `Your OTP is ${otp}`,
//       from: twilioPhone,
//       to: phoneNumber,
//     });

//     return { message: 'OTP sent successfully', otp };
//     // res.status(200).json({ message: "OTP sent successfully", otp }); // For dev, include OTP (remove in prod)
//   } catch (error: any) {
//     return { message: 'Failed to send OTP', error: error.message };
//     // res.status(500).json({ message: "Failed to send OTP", error: error.message });
//   }
// };

// forgot  Password Otp Match
const forgotPasswordOtpMatch = async ({
  otp,
  token,
}: OTPVerifyAndCreateUserProps) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  const decodeData = verifyToken({
    token,
    access_secret: config.jwt_access_secret as string,
  });

  if (!decodeData) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorised');
  }

  const { email } = decodeData;

  const isOtpMatch = await otpServices.otpMatch(email, otp);

  if (!isOtpMatch) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP did not match');
  }

  process.nextTick(async () => {
    await otpServices.updateOtpByEmail(email, {
      status: 'verified',
    });
  });

  const user: TUser | null = await User.isUserActive(email);

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const jwtPayload = {
    email: email,
    userId: user?._id,
  };

  const forgetOtpMatchToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.otp_token_expire_time as string | number,
  });

  return { forgetOtpMatchToken };
};

// Reset password
const resetPassword = async ({
  token,
  newPassword,
  confirmPassword,
}: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  if (newPassword !== confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Password does not match');
  }

  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  const decodeData = verifyToken({
    token,
    access_secret: config.jwt_access_secret as string,
  });

  if (!decodeData) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorised');
  }

  const { email, userId } = decodeData;

  const user: TUser | null = await User.isUserActive(email);

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true },
  );

  return result;
};

// Change password
const changePassword = async ({
  userId,
  newPassword,
  oldPassword,
}: {
  userId: string;
  newPassword: string;
  oldPassword: string;
}) => {
  const user = await User.IsUserExistById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!(await User.isPasswordMatched(oldPassword, user.password))) {
    throw new AppError(httpStatus.FORBIDDEN, 'Old password does not match');
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const result = await User.findByIdAndUpdate(
    userId,
    { password: hashedPassword },
    { new: true },
  );

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User updating failed');
  }

  return result;
};

// rest ..............................

// Forgot password

// Refresh token
const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }

  const decoded = verifyToken({
    token,
    access_secret: config.jwt_refresh_secret as string,
  });

  const { email } = decoded as any;

  const activeUser = await User.isUserActive(email);

  if (!activeUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const jwtPayload: {
    userId: string;
    role: string;
    fullName?: string;
    email: string;
    phone?: string;
  } = {
    fullName: activeUser?.name,
    email: activeUser.email,
    phone: activeUser.phone,
    userId: activeUser?._id?.toString() as string,
    role: activeUser?.role,
  };

  const accessToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.jwt_access_expires_in as string,
  });

  return {
    accessToken,
  };
};

export const authServices = {
  login,
  googleLogin,
  forgotPasswordOtpMatch,
  changePassword,
  forgotPasswordByEmail,
  // forgotPasswordByNumber,
  resetPassword,
  refreshToken,
};


