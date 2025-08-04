import { Schema } from "mongoose";


export interface IFriendship extends Document {
  userId: Schema.Types.ObjectId;
  friendship: Schema.Types.ObjectId[];
}
