import moment from 'moment';
import config from '../../config';
import { generateOtp } from '../../utils/otpGenerator';

const generateOptAndExpireTime = (expireTime?: string) => {
  const otp = generateOtp();

  const otpExpiryTime = parseInt(expireTime as string) || 2;

  const expiredAt = moment().add(otpExpiryTime, 'minute').toISOString();

console.log("expiredAt", {expiredAt})

  return {
    otp,
    expiredAt,
  };
};

export { generateOptAndExpireTime };
