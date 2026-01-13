import { Router } from 'express';
import { otpControllers } from './otp.controller'; 
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
export const otpRoutes = Router();


  otpRoutes.patch('/resend-otp', otpControllers.resendOtp);
  otpRoutes.post('/send-delete-account-otp', auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), otpControllers.sendDeleteAccountOtpForGoogle);

