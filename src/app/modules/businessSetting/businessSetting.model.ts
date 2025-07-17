import mongoose, { Schema, Document } from "mongoose";

// Interface for Privacy Policy
export interface ISettings extends Document {
  content: string;
  key: 'privacy_policy' | "term_condition" | "cookie_policy";
}

// Privacy Policy Schema
const businessSettingsSchema = new Schema<ISettings>(
  {
    content: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      enum: ['privacy_policy', 'term_condition', 'cookie_policy', 'about_us'], // enum ensures that only these values are valid
      required: true,
    },
  },
  { timestamps: true }
);


const BusinessSettings = mongoose.model<ISettings>("BusinessSettings", businessSettingsSchema);

export default BusinessSettings;
