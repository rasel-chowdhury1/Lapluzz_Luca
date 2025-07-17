import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { otpRoutes } from "../modules/otp/otp.routes";
import { settingsRoutes } from "../modules/setting/setting.route";
import { notificationRoutes } from "../modules/notifications/notifications.route";
import { profileRoutes } from "../modules/profile/profile.route";
import { businessRoutes } from "../modules/business/business.route";
import { categoryRoutes } from "../modules/category/category.route";
import { businessReviewRoutes } from "../modules/businessReview/businessReveiw.route";
import { businessEngagementStatsRoutes } from "../modules/businessEngaagementStats/businessEngaagementStats.route";
import { eventRoutes } from "../modules/event/event.route";
import { requestCategoryRoutes } from "../modules/requestCategory/requestCategory.route";
import { wishListRoutes } from "../modules/wishlist/wishlist.route";
import { postCommunityRoutes } from "../modules/postCommunity/postCommunity.route";
import { businessSettingsRoutes } from "../modules/businessSetting/businessSetting.route";
import { faqRoutes } from "../modules/faq/faq.router";
import { InspirationRoutes } from "../modules/inspiration/inspiration.route";
import { eventReviewRoutes } from "../modules/eventReview/eventReview.route";
import { eventEngagementStatsRoutes } from "../modules/eventEngagementStats/eventEngagementStats.route";
import { PostCommunityEngagementStatsRoutes } from "../modules/postCommunityEngagementStats/postCommunityEngagementStats.route";
import { pollCommunityRoutes } from "../modules/pollCommunity/pollCommunity.route";
import { ReportRoutes } from "../modules/report/report.route";
import { ChatRoutes } from "../modules/chat/chat.route";
import { jobRoutes } from "../modules/job/job.route";
import { jobEngagementStatsRoutes } from "../modules/jobEngagementStats/jobEngagementStats.route";
import { jobReviewRoutes } from "../modules/jobReview/jobReview.route";
import { TicketSupportRoutes } from "../modules/ticketSupport/ticketSupport.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { JobApplicantRoutes } from "../modules/jobApplicant/jobApplicant.route";
import { messageRoutes } from "../modules/message/message.route";
import { searchRecord } from "../modules/searchRecord/searchRecord.route";
import { EventInterestRoutes } from "../modules/eventInterest/eventInterest.route";

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: "/otp",
    route: otpRoutes
  },
  {
    path: "/profile",
    route: profileRoutes
  },
  {
    path: "/settings",
    route: settingsRoutes
  },
  {
     path: "/notifications",
     route: notificationRoutes
  },
  
  {
     path: "/business",
     route: businessRoutes
  },
  {
     path: "/business/engaagement",
     route: businessEngagementStatsRoutes
  },
  {
     path: "/businessReview",
     route: businessReviewRoutes
  },

  // event
  {
     path: "/event",
     route: eventRoutes
   },
  {
     path: "/event/engaagement",
     route: eventEngagementStatsRoutes
  },
  {
     path: "/eventReview",
     route: eventReviewRoutes
  },
   {
     path: "/event-interest",
     route: EventInterestRoutes
   },
  
   //job
   {
     path: "/job",
     route: jobRoutes
   },

   {
     path: "/job/engaagement",
     route: jobEngagementStatsRoutes
  },
  {
     path: "/jobReview",
     route: jobReviewRoutes
  },
   {
     path: "/jobApply",
     route: JobApplicantRoutes
   },
  {
     path: "/category",
     route: categoryRoutes
  },
  {
     path: "/requestCategory",
     route: requestCategoryRoutes
  },
  {
     path: "/wishlist",
     route: wishListRoutes
  },
  {
     path: "/postCommunity",
     route: postCommunityRoutes
   },
    {
     path: "/community/engaagement",
     route: PostCommunityEngagementStatsRoutes
   },
  
   {
     path: "/pollCommunity",
     route: pollCommunityRoutes
   },

   
  {
     path: "/inspiration",
     route: InspirationRoutes
   },
  
   // chat 
   {
     path: "/chat",
     route: ChatRoutes
  },
   {
     path: "/message",
     route: messageRoutes
  },

  // business settings
  {
   path: "/settings",
   route: settingsRoutes
  },
  {
   path: "/faq",
   route: faqRoutes
  },
  {
   path: "/settings/business",
   route: businessSettingsRoutes
   },
  
   //report
   {
   path: "/report",
   route: ReportRoutes
  },
   
  //notifications
  {
    path: "/notification",
    route: notificationRoutes
   },
   
  //tickets
  {
    path: "/ticket",
    route: TicketSupportRoutes
  },
  
  //subscriptions
  {
    path: "/subscription",
    route: SubscriptionRoutes
  },

  // search record
  {
    path: "/search",
    route: searchRecord
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;