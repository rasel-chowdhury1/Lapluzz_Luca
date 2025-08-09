import { Schema } from 'mongoose';

export interface IMessage {
  text: string;
  images?: string[];
  readBy: Schema.Types.ObjectId[]; // Array of user IDs who read the message
  isLeft: boolean;
  seen: boolean;
  sender: Schema.Types.ObjectId; // Reference to the sender (User)
  chat: Schema.Types.ObjectId; // Reference to the chat (Chat)
}
