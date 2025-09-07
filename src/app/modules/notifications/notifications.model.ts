import { Schema, model } from 'mongoose';
import { INotification } from './notifications.interface';


const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    message: {
      type: {
        fullName: {type: String, default: false},
        image: { type: String, default: "" }, // Store the image URL or path
        text: { type: String, required: true },  // Store additional data
        name: { type: String, required: false},  // Store additional data
        types: { type: String, enum: ["business", "event", "job"], required: false},  // Store additional data
        notificationFor: { type: String, required: false },  // Store additional data
      },
      required: true, // The message object itself is required
    },
    type: {
      type: String,
      enum: ["added", "adminProvide", "social", "BusinessNotification", "EventNotification", "JobNotification","review", "direct", "mass", "CouponOfferNotification"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["Push Notification", "Email"],
      default: "Push Notification"
    },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Confirmed"],
      default: "Sent"
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    notificationEventId: {
      type: String, // Store a unique ID for the notification event
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create and export the Notification model
const Notification = model<INotification>('Notification', NotificationSchema);

export default Notification;