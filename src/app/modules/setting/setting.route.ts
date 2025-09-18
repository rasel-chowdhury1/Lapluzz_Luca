import { Router } from "express";
import { settingsController } from "./setting.controller";
import { USER_ROLE } from "../user/user.constants";
import auth from "../../middleware/auth";

export const settingsRoutes = Router();


settingsRoutes
     // Route to get the privacy policy
    .get(
     "/privacy", 
    //  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
     settingsController.getPrivacyPolicy
)
    .get(
     "/accept-privacy-policy", 
    //  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
     settingsController.getAnyonePrivacyPolicy
)
    .get(
     "/business/accept-privacy-policy", 
    //  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
     settingsController.getBusinessPrivacyPolicy
)
    .get(
     "/business/termAndConditions", 
    //  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
     settingsController.getBusinessPrivacyPolicy
)
    .get(
      "/termAndConditions", 
    //   auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
      settingsController.getTermConditions
)
    .get(
      "/cookiePolicy", 
    //   auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
      settingsController.getCookiePolicy
)
    .get("/aboutUs", settingsController.getAboutUs)
    // Route to create or update the privacy policy
    .put("/", settingsController.updateSettingsByKey);
