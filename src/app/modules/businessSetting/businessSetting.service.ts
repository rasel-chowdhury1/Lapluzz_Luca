import BusinessSettings, { ISettings } from "./businessSetting.model";



// Get the settings
const getSettingsByKey = async (payload: {key: 'privacy_policy' | "term_condition"  | "cookie_policy" | 'about_us' }) => {
    const result = await BusinessSettings.findOne(payload).sort({ createdAt: -1 });

    return result;
};

// Create or update the privacy policy
const updateSettingsByKey = async (key: string, content: string): Promise<ISettings> => {
    let policy = await BusinessSettings.findOne({key});
    if (!policy) {
        policy = new BusinessSettings({key, content });
    } else {
        policy.content = content;
    }
    return await policy.save();
};

export const businessSettingsService = {
    getSettingsByKey,
    updateSettingsByKey
};
