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
  
  
  .post(
    "/direct",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentNotificationToDirect
)
  
  
  .post(
    "/search",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentSearchNotificationToBusinesses
)
  
  .post(
    "/mass-notification",
    auth(USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    notificationController.sentNotificationToMass
)
  

  
  .get(
    '/all-notifications', 
    auth('user'), 
    notificationController.getAllNotifications
  )


  
  .get(
    '/my-notifications', 
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN), 
    notificationController.getMyNotifications
  )
  
  .get(
    '/my-sented-notifications', 
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN), 
    notificationController.getMySentedNotifications
  )

  .get(
    "/mass",
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN), 
    notificationController.getMassNotifications
  )
  .get(
    "/today-count",
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN), 
    notificationController.getTodayHowManySentNotifications
  )
  .get(
    "/unread",
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN), 
    notificationController.getUnreadCount
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
