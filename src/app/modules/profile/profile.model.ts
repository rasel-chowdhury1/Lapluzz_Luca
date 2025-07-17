import { model, Schema } from "mongoose";
import { IProfile } from "./profile.interface";

const ProfileSchema = new Schema<IProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Profile = model<IProfile>("Profile", ProfileSchema);
export default Profile;
