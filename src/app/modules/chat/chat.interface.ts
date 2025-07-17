import { Schema } from "mongoose";

export interface IChat {
    users: Schema.Types.ObjectId[]; // Array of user IDs in the chat
    createdBy: Schema.Types.ObjectId; // Reference to User who created the chat
    isGroupChat: boolean; // Whether it's a group chat
    unreadCounts: number;
    blockedUsers?: Schema.Types.ObjectId[]; // Array of blocked users
  }

