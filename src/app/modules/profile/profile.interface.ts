import { Schema } from "mongoose";

export interface IProfile {
    user: Schema.Types.ObjectId;
  }