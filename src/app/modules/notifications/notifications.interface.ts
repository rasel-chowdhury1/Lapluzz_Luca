import { Schema } from "mongoose";


export interface INotification {
    userId: Schema.Types.ObjectId; // Reference to User
    receiverId: Schema.Types.ObjectId; // Reference to User
    message: { 
      fullName?: string;
      image: string; // URL or path to the user's image
      text: string; // Additional data (text or other relevant information)
      name?: string; // Optional array of photo URLs or paths
      type?: string; // Optional array of photo URLs or paths
      notificationFor?: string;
    };
    type: "added" | "adminProvide" | "social" ; // Type of notification
    channel: string;
    status: string;
    sentCount: number;
    notificationEventId?: string;
    isRead: boolean; // Whether the notification is read
    
  }