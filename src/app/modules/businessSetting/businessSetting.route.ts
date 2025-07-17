import { Router } from "express";
import { businessSettingsController } from "./businessSetting.controller";

export const businessSettingsRoutes = Router();


businessSettingsRoutes
     // Route to get the privacy policy
    .get(
     "/privacy", 
     businessSettingsController.getPrivacyPolicy
     )

    .get(
     "/termAndConditions", 
     businessSettingsController.getTermConditions
)
     .get(
     "/termAndConditions", 
     businessSettingsController.getCookiePolicy
)
     
     .get(
     "/cookiePolicy", 
     businessSettingsController.getCookiePolicy
)
    .get(
     "/aboutUs", 
     businessSettingsController.getAboutUs
    )
    // Route to create or update the privacy policy
    .put(
     "/", 
     businessSettingsController.updateSettingsByKey
);