
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import Notification from './notifications.model';

interface ICreateNotificationProps {
  userId: string;
  receiverId: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
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



const getAllNotifications = async (query: Record<string, unknown>) => {
  // You can implement a query builder like in your `userService` for pagination, filtering, etc.
  const notifications = await Notification.find(query);
  return notifications;
};

const getMyNotifications = async (userId: string) => {
  const notifications = await Notification.find({ receiverId: userId }).sort({ createdAt: -1 });
  return notifications;
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
  getMassNotifications,
  getAllNotifications,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
