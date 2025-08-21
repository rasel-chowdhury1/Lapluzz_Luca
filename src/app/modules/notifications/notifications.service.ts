
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import Notification from './notifications.model';
import Business from '../business/business.model';
import { emitMassNotification } from '../../../socketIo';
import mongoose from 'mongoose';
import Event from '../event/event.model';
import { startOfDay, endOfDay } from 'date-fns';
import Job from '../job/job.model';

interface ICreateNotificationProps {
  userId: string;
  receiverId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface ISendMassNotificationParams {
  location: { latitude: number; longitude: number };
  rangeKm: number;
  category: "all" | "event" | "business";
  message: {
    image?: string;
    text: string;
  };
  senderId: string; // The user sending the notification
}

const createNotification = async ({
  userId,
  receiverId,
  message,
  type,
}: ICreateNotificationProps) => {
  const newNotification = new Notification({
    userId,
    receiverId,
    message,
    type,
    isRead: false,
  });

  await newNotification.save();
  return newNotification;
};

const sendMassNotification = async ({
  location,
  rangeKm,
  category,
  message,
  senderId,
}: ISendMassNotificationParams) => {
  let receiverIds: string[] = [];

  // 1️⃣ Build location query
  const locationQuery = {
    location: {
      $geoWithin: {
        $centerSphere: [
          [location.longitude, location.latitude],
          rangeKm / 6378.1,
        ],
      },
    },
  };

  // 2️⃣ Fetch business authors
  if (category === "business" || category === "all") {
    const businesses = await Business.find(locationQuery, { author: 1 }).lean();
    receiverIds.push(...businesses.map((b) => b.author.toString()));
  }

  // 3️⃣ Fetch event authors
  if (category === "event" || category === "all") {
    const events = await Event.find(locationQuery, { author: 1 }).lean();
    receiverIds.push(...events.map((e) => e.author.toString()));
  }

  // 4️⃣ Remove duplicates
  receiverIds = [...new Set(receiverIds)];

  if (receiverIds.length === 0) {
    return { count: 0, receivers: [] };
  }

  // 5️⃣ Emit notifications (handles DB insert + socket)
  await Promise.all(
    receiverIds.map((receiverId) =>
      emitMassNotification({
        userId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        userMsg: {
          image: message.image || "",
          text: message.text,
        },
      })
    )
  );

  return { count: receiverIds.length, receivers: receiverIds };
};

const getAllNotifications = async (query: Record<string, unknown>) => {
  // You can implement a query builder like in your `userService` for pagination, filtering, etc.
  const notifications = await Notification.find(query);
  return notifications;
};

const getMyNotifications = async (userId: string) => {
  const notifications = await Notification.find({ receiverId: userId }).sort({ createdAt: -1 });
  return notifications;
};


const getMySentedNotifications = async (userId: string) => {
  let notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();

  // Loop through notifications and attach names
  notifications = await Promise.all(
    notifications.map(async (notification) => {
      if (notification.message?.types && notification.message?.notificationFor) {
        let model;
        if (notification.message.types === "business") {
          model = Business;
        } else if (notification.message.types === "event") {
          model = Event;
        } else if (notification.message.types === "job") {
          model = Job;
        }

        if (model) {
          const doc = await model.findById(notification.message.notificationFor).select("name title").lean();
          if (doc) {
            // For businesses we use `name`, for events/jobs `title`
            notification.message.name = doc.name || doc.title || "";
          }
        }
      }
      return notification;
    })
  );

  return notifications;
};


const getTodayHowManySentNotifications = async (userId: string) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const count = await Notification.countDocuments({
    userId,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  return count || 0;
};

const getMassNotifications = async () => {
  return await Notification.find({
    type: { $in: ["adminProvide", "mass", "direct"] }
  }).populate("receiverId", "name sureName email customId")
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};


const markAsRead = async (id: string) => {
  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return notification;
};

const markAllAsRead = async (receiverId: string) => {
  const result = await Notification.updateMany(
    { receiverId, isRead: false }, // Only update unread notifications
    { $set: { isRead: true } }
  );

  if (result.modifiedCount === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No unread notifications found');
  }

  return;
};

// const sendMassNotification = async ({
//   location,
//   rangeKm,
//   category,
//   message,
//   senderId,
// }) => {
//   let receiverIds: string[] = [];

//     const locationQuery = {
//       location: {
//         $geoWithin: {
//           $centerSphere: [
//             [location.longitude, location.latitude],
//             rangeKm / 6378.1, // Earth's radius in km
//           ],
//         },
//       },
//     };

//     if (category === "business" || category === "all") {
//       const businesses = await Business.find(locationQuery, { author: 1 }).lean();
//       receiverIds.push(...businesses.map((b) => b.author.toString()));
//     }

//     if (category === "event" || category === "all") {
//       const events = await Event.find(locationQuery, { author: 1 }).lean();
//       receiverIds.push(...events.map((e) => e.author.toString()));
//     }

//     // Remove duplicates
//     receiverIds = [...new Set(receiverIds)];
  

//   // 3️⃣ Prepare notification documents
//   const notifications: INotification[] = receiverIds.map((receiverId) => ({
//     userId: new mongoose.Types.ObjectId(senderId),
//     receiverId: new mongoose.Types.ObjectId(receiverId),
//     message: {
//       fullName: false, // or set sender's name if needed
//       image: message.image || "",
//       text: message.text,
//     },
//     type: "mass",
//     channel: "Push Notification",
//     status: "Sent",
//     isRead: false,
//   })) as INotification[];

//   // 4️⃣ Insert into DB
//   if (notifications.length > 0) {
//     await Notification.insertMany(notifications);
//   }

//   return { success: true, count: notifications.length };
// };

const deleteNotification = async (id: string) => {
  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return ;
};

export const notificationService = {
  createNotification,
  sendMassNotification,
  getMassNotifications,
  getTodayHowManySentNotifications,
  getAllNotifications,
  getMyNotifications,
  getMySentedNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
