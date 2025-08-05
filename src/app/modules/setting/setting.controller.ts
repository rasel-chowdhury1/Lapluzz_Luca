import { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { settingsService } from "./settting.service";
import { USER_ROLE } from "../user/user.constants";
import { businessSettingsService } from "../businessSetting/businessSetting.service";

// Get the privacy policy
const getPrivacyPolicy = async (req: Request, res: Response) => {

    const { role } = req.user;
    console.log({role})
    try {
        let policy;
        if (role === USER_ROLE.USER || role === USER_ROLE.ADMIN || role === USER_ROLE.SUPER_ADMIN) {
            console.log("hitted")
          policy = await settingsService.getSettingsByKey({key: "privacy_policy"});
        }
        else if(role === USER_ROLE.ORGANIZER){
        policy = await businessSettingsService.getSettingsByKey({key: "privacy_policy"});
        }
        else {
            policy = await settingsService.getSettingsByKey({key: "privacy_policy"});
        }

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Privacy policy retrieved successfully",
            data: policy || null,
        });
    } catch (error: any) {
        console.error("Error retrieving privacy policy:", error.message);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to retrieve privacy policy",
            data: null,
        });
    }
};

const getAnyonePrivacyPolicy = async (req: Request, res: Response) => {


   let policy = await settingsService.getSettingsByKey({ key: "privacy_policy" });
    
    sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Privacy policy retrieved successfully",
            data: policy || null,
        });
};
const getBusinessPrivacyPolicy  = async (req: Request, res: Response) => {


   let policy = await businessSettingsService.getSettingsByKey({ key: "privacy_policy" });
    
    sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Privacy policy retrieved successfully",
            data: policy || null,
        });
};

// Get the term conditions
const getTermConditions = async (req: Request, res: Response) => {
    const {role} = req.user;
    try {
        let policy;
        if(role === USER_ROLE.USER || role === USER_ROLE.ADMIN){
          policy = await settingsService.getSettingsByKey({key: "term_condition"}) ;
        }
        else if(role === USER_ROLE.ORGANIZER){
          policy = await businessSettingsService.getSettingsByKey({key: "term_condition"});
        }
        

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Term and conditions retrieved successfully",
            data: policy || [],
        });
    } catch (error: any) {
        console.error("Error retrieving privacy policy:", error.message);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to retrieve term and conditions",
            data: null,
        });
    }
};

// Get the term conditions
const getCookiePolicy = async (req: Request, res: Response) => {
    const {role} = req.user;
    try {
        let policy;
        if(role === USER_ROLE.USER|| role === USER_ROLE.ADMIN){
          policy = await settingsService.getSettingsByKey({key: "cookie_policy"}) ;
        }
        else if(role === USER_ROLE.ORGANIZER){
          policy = await businessSettingsService.getSettingsByKey({key: "cookie_policy"});
        }
        

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Cookie policy retrieved successfully",
            data: policy || [],
        });
    } catch (error: any) {
        console.error("Error retrieving privacy policy:", error.message);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to retrieve term and conditions",
            data: null,
        });
    }
};

// Get the term conditions
const getAboutUs = async (req: Request, res: Response) => {
    try {
        const policy = await settingsService.getSettingsByKey({key: "about_us"});

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "About us retrieved successfully",
            data: policy || null,
        });
    } catch (error: any) {
        console.error("Error retrieving privacy policy:", error.message);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Failed to retrieve about us",
            data: null,
        });
    }
};

// Update the privacy policy
const updateSettingsByKey = async (req: Request, res: Response) => {
    try {
        const { key, content } = req.body;
        const updatedPolicy = await settingsService.updateSettingsByKey(key, content);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: `${key}  updated successfully`,
            data: updatedPolicy,
        });
    } catch (error: any) {
        console.error("Error updating privacy policy:", error.message);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: `Failed to update settings`,
            data: null,
        });
    }
};

export const settingsController = {
    getPrivacyPolicy,
    getTermConditions,
    getCookiePolicy,
    getAboutUs,
    updateSettingsByKey,
    getAnyonePrivacyPolicy,
    getBusinessPrivacyPolicy,
};
