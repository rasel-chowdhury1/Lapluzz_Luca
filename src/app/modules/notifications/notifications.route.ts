import { Router } from 'express';
import auth from '../../middleware/auth';
import { notificationController } from './notifications.controller';
import { otpControllers } from '../otp/otp.controller';
import { USER_ROLE } from '../user/user.constants';

export const notificationRoutes = Router();



notificationRoutes
  .post(
    "/create",
    auth('user', "admin"),
    notificationController.createNotification
)
  
  .post(
    "/business/sent-notification",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentNotificationToFollowersOfBusiness
  )
  
  .post(
    "/event/sent-notification",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentNotificationToInterestedUsersOfEvent
  )
  
  .post(
    "/job/sent-notification",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentNotificationToApplicantsOfJob
  )
  
  
  
  .get(
    '/all-notifications', 
    auth('user'), 
    notificationController.getAllNotifications
  )

  .get(
    '/my-notifications', 
    auth('user', 'admin'), 
    notificationController.getMyNotifications
  )

  .patch(
    '/mark-read/:id', 
    auth('user'), 
    notificationController.markAsRead
  )

  .patch(
    "/read-all", 
    auth("user", "admin"), 
    notificationController.markAllAsRead
  )

  
  .delete(
    '/delete/:id', 
    auth('user'), 
    notificationController.deleteNotification
  );
