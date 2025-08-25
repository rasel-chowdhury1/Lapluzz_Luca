import { Schema } from "mongoose";

export interface IChat {
    users: Schema.Types.ObjectId[]; // Array of user IDs in the chat
    createdBy: Schema.Types.ObjectId; // Reference to User who created the chat
    userName: string;
    chatName: string;
    isGroupChat: boolean; // Whether it's a group chat
    unreadCounts: number;
    blockedUsers?: Schema.Types.ObjectId[]; // Array of blocked users
    contextOwner?:  Schema.Types.ObjectId;
    contextType?: string;
    contextId?: Schema.Types.ObjectId;
    status: string;
    chatType: string;
  }


  