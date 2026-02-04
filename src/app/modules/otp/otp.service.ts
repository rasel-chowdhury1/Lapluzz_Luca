import Otp from './otp.model';
import { CreateOtpParams, TPurposeType } from './otp.interface';
import AppError from '../../error/AppError';
import { verifyToken } from '../../utils/tokenManage';
import httpStatus from 'http-status';
import config from '../../config';
import { generateOptAndExpireTime } from './otp.utils';
import { otpSendEmail } from '../../utils/emailNotifiacation';
import { User } from '../user/user.models';
import { Login_With } from '../user/user.constants';

const createOtp = async ({
  name,
  sentTo,
  receiverType,
  purpose,
  otp,
  expiredAt,
}: CreateOtpParams) => {
  // const expiredAtDate = new Date(expiredAt);
  const newOTP = new Otp({
    sentTo,
    receiverType,
    purpose,
    otp,
    expiredAt,
  });

  await newOTP.save();

  return newOTP;
};

const checkOtpByEmail = async (email: string, purpose?: TPurposeType) => {

  const isExist = await Otp.findOne({
    sentTo: email,
    purpose,
  });

  const isExpireOtp = await Otp.findOne({
    sentTo: email,
    purpose,
    expiredAt: { $lt: new Date() }, // Use the `$gt` operator for comparison
  });


  return { isExist, isExpireOtp };
};

const checkOtpByNumber = async (phone: string) => {
  const isExist = await Otp.findOne({
    sentTo: phone,
  });

  console.log({ phone });

  console.log({ isExist });

  const isExpireOtp = await Otp.findOne({
    sentTo: phone,
    expiredAt: { $lt: new Date() }, // Use the `$gt` operator for comparison
  });

  console.log({ isExpireOtp });

  console.log('.........');

  return { isExist, isExpireOtp };
};

const otpMatch = async (email: string, otp: string) => {
  console.log(email, otp, { $gt: new Date().toISOString() });
  const isOtpMatch = await Otp.findOne({
    sentTo: email,
    otp,
    expiredAt: { $gt: new Date().toISOString() },
    status: 'pending',
  });

  console.log({ isOtpMatch });

  return isOtpMatch;
};

const updateOtpByEmail = async (
  email: string,
  payload: Record<string, any>,
  purpose?: TPurposeType
) => {
  console.log(payload);
  const otpUpdate = await Otp.findOneAndUpdate(
    {
      sentTo: email,
      purpose,
    },
    payload,
    { new: true },
  );

  return otpUpdate;
};

const resendOtpEmail = async ({ token }: { token: string }) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token not found');
  }
  const decodeData = verifyToken({
    token,
    access_secret: config.jwt_access_secret as string,
  });
  
  const { email } = decodeData as any;

  const { isExist, isExpireOtp } = await checkOtpByEmail(email);

  const { otp, expiredAt } = generateOptAndExpireTime();

  if (!isExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Token data is not valid !!');
  } else if (isExist && !isExpireOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Otp exist. Please check email.',
    );
  } else if (isExist && isExpireOtp) {
    const otpUpdateData = {
      otp,
      expiredAt,
    };

    await updateOtpByEmail(email, otpUpdateData);
  }

  process.nextTick(async () => {
    await otpSendEmail({
      sentTo: email,
      subject: 'Reinvia il tuo codice OTP monouso per la verifica dell’email.', //Re-send your one time otp for email  verification
      name: '',
      otp,
      purpose: "",
      expiredAt: expiredAt,
      expireTime: config.otp_expire_time as string || "2"
    });
  });
};


const sendDeleteAccountOtpForGoogleAndApple = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

    if (
      user.loginWth !== Login_With.google &&
      user.loginWth !== Login_With.apple
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'OTP is only required for Google or Apple accounts',
      );
    }

  if(!user.email){
    throw new AppError(httpStatus.BAD_REQUEST, 'User email not found');
  }

  const { isExist, isExpireOtp } = await otpServices.checkOtpByEmail(user.email, 'delete-account');

  const { otp, expiredAt } = generateOptAndExpireTime("5"); // 5 minutes OTP

  // ✅ OTP purpose
  const otpPurpose: TPurposeType = 'delete-account';

  if (isExist && !isExpireOtp) {
    // If a valid OTP already exists, do not create a new one, maybe resend
    process.nextTick(async () => {
      await otpSendEmail({
        sentTo: user.email,
        subject: 'Conferma eliminazione account',
        name: user.name || user.sureName || 'Utente',
        otp: otp, // or use existing OTP if you want to resend same
        purpose: 'delete_account',
        expiredAt: expiredAt,
        expireTime: "5",
      });
    });
    return { message: 'OTP already sent. Please check your email.' };
  } else if (isExist && isExpireOtp) {
    // Update expired OTP
    const otpUpdateData = { otp, expiredAt };
    await otpServices.updateOtpByEmail(user.email, otpUpdateData, otpPurpose);
  } else if (!isExist) {
    // Create new OTP
    await otpServices.createOtp({
      name: user.name || 'Utente',
      sentTo: user.email,
      receiverType: 'email',
      purpose: otpPurpose,
      otp,
      expiredAt,
    });
  }

  // Send OTP Email
  process.nextTick(async () => {
    await otpSendEmail({
      sentTo: user.email,
      subject: 'Conferma eliminazione account',
      name: user.name || user.sureName || 'Utente',
      otp,
      purpose: 'delete_account',
      expiredAt: expiredAt,
      expireTime: "5",
    });
  });

  return { message: 'OTP sent successfully.' };
};

export const otpServices = {
  createOtp,
  checkOtpByEmail,
  checkOtpByNumber,
  otpMatch,
  updateOtpByEmail,
  resendOtpEmail,
  sendDeleteAccountOtpForGoogleAndApple
};
