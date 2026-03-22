import {  createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import colors from 'colors'; // Ensure correct import
import config from './app/config';
import createDefaultAdmin from './app/DB/createDefaultAdmin';
import { emitNotification, emitReminderNotificationToBusinessUser, initSocketIO } from './socketIo';
import { logger } from './app/utils/logger';
import cron from 'node-cron';
import { User } from './app/modules/user/user.models';
import { sendReminderNotification } from './app/utils/sentNotificationByFcmToken';
import { getAdminData } from './app/DB/adminStore';
import MySubscription from './app/modules/mySubscription/mySubscription.model';
import SubscriptionPayment from './app/modules/subscriptionPayment/subscriptionPayment.model';
import { autoStopExpiredSubscriptions } from './app/utils/autoStopExpiredSubscriptions';
import { USER_ROLE } from './app/modules/user/user.constants';

// Create a new HTTP server
const socketServer = createServer();


let server: Server;

async function main() {
  try {

    const dbStartTime = Date.now();
    const loadingFrames = ["🌍", "🌎", "🌏"]; // Loader animation frames
    let frameIndex = 0;

    // Start the connecting animation
    const loader = setInterval(() => {
      process.stdout.write(
        `\rMongoDB connecting ${loadingFrames[frameIndex]} Please wait 😢`,
      );
      frameIndex = (frameIndex + 1) % loadingFrames.length;
    }, 300); // Update frame every 300ms



    // Connect to MongoDB with a timeout
    await mongoose.connect(config.database_url as string, {
      connectTimeoutMS: 10000, // 10 seconds timeout
    });


    // Stop the connecting animation
    clearInterval(loader);
    logger.info(
      `\r✅ Mongodb connected successfully in ${Date.now() - dbStartTime}ms`,
    );

    //create a defult admin
    createDefaultAdmin()

    // Start HTTP server
    server = createServer(app);

    server.listen(Number(config.port), () => {
      console.log(
        colors.green(`---> Lapluzz server is listening on  : http://${config.ip}:${config.port}`).bold,
      );
    // Initialize Socket.IO
    initSocketIO(socketServer);

    });
  } catch (err) {
    console.error('Error starting the server:', err);
  }
}

main();

// Graceful shutdown for unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection detected: ${err}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1); // Ensure process exits
});

// Graceful shutdown for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception detected: ${err}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});


// Cron job for sending reminder notifications to users without business listings // Every day at midnight
// cron.schedule("0 0 * * *", async () => {
//   const adminData = getAdminData();

//   if (!adminData || !adminData._id) {
//     console.error("Admin data not found. Cannot send reminder notifications.");
//     return; // Stop the cron job if no admin data
//   }

//   try {
//     // Convert adminData._id to ObjectId explicitly
//     const adminId = new mongoose.Types.ObjectId(adminData._id);

//     // Fetch users without business listings
//     const usersWithoutListings = await User.find({
//       role: "organizer",
//       parentBusiness: null,
//       isDeleted: false,
//       isBlocked: false,
//     }).select('_id name'); // Only fetch the required fields (_id, name)

//     if (usersWithoutListings.length === 0) {
//       console.log("No users found without listings.");
//       return; // Exit if no users need notifications
//     }

//     // Prepare notifications in bulk using a map for better performance
//     const notificationPromises = usersWithoutListings.map((user) => {
//       if (!user._id) return; // Skip invalid users

//       // Convert user._id to ObjectId explicitly
//       const userId = new mongoose.Types.ObjectId(user._id);

//       // Prepare the notification
//       const userMsg = {
//         name: "🚀 Crea la tua inserzione aziendale", // Create Your Business Listing
//         image: adminData.profileImage ?? "",
//         text: `Ciao ${user.name}, non hai ancora creato la tua prima attività. Inizia oggi e cresci con Pianofesta! 🌟`, // Hi ${user.name}, you haven’t created your first business yet. Start today and grow with Pianofesta! 
//       };

//       // Emit notification (async operation)
//       return emitReminderNotificationToBusinessUser({
//         userId: adminId,  // Using the ObjectId
//         receiverId: userId, // Using the ObjectId
//         userMsg,
//       });
//     });

//     // Execute all notification promises in parallel
//     await Promise.all(notificationPromises);

//   } catch (err) {
//     console.error("❌ Error in sending reminder notifications:", err);
//   }
// }, {
//   timezone: "Europe/Rome", // Italy timezone
// });

const isProfileIncomplete = (user: any) =>
  !user.name || !user.phone || !user.dateOfBirth;

const isProfileComplete = (user: any) =>
  user.name && user.phone && user.dateOfBirth;

/* =========================
   Cron job - runs every day at midnight Europe/Rome
========================= */
cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      const adminData = getAdminData();
      if (!adminData?._id) {
        console.error('Admin data not found. Cannot send notifications.');
        return;
      }

      const adminId = new mongoose.Types.ObjectId(adminData._id);

      // 🔥 Single query for USER and ORGANIZER
      const users = await User.find({
        role: { $in: [USER_ROLE.USER, USER_ROLE.ORGANIZER] },
        isDeleted: false,
        isBlocked: false,
      }).select('_id name phone dateOfBirth role parentBusiness');

      if (!users.length) {
        console.log('No users found for notifications.');
        return;
      }

      const notifications: Promise<any>[] = [];

      for (const user of users) {
        const receiverId = new mongoose.Types.ObjectId(user._id);

        /* =====================
           USER → Complete Profile
        ====================== */
        if (user.role === USER_ROLE.USER && isProfileIncomplete(user)) {
          notifications.push(
            emitReminderNotificationToBusinessUser({
              userId: adminId,
              receiverId,
              userMsg: {
                name: '⚠️ Completa il tuo profilo',
                image: adminData.profileImage ?? '',
                text: `Ciao ${user.name || 'utente'}, completa il tuo profilo (nome, telefono e data di nascita) per sbloccare tutte le funzionalità 🌟`,
              },
            }),
          );
          continue; // skip to next user
        }

        /* =====================
           ORGANIZER → Create Business Listing
        ====================== */
        if (
          user.role === USER_ROLE.ORGANIZER &&
          isProfileComplete(user) &&
          !user.parentBusiness
        ) {
          notifications.push(
            emitReminderNotificationToBusinessUser({
              userId: adminId,
              receiverId,
              userMsg: {
                name: '🚀 Crea la tua inserzione aziendale',
                image: adminData.profileImage ?? '',
                text: `Ciao ${user.name}, non hai ancora creato la tua attività. Crea la tua inserzione oggi e inizia a crescere con Pianofesta 🚀`,
              },
            }),
          );
        }
      }

      if (!notifications.length) {
        console.log('No notifications to send today.');
        return;
      }

      // Execute all notifications in parallel
      await Promise.all(notifications);

      console.log(`✅ Sent ${notifications.length} notifications successfully.`);
    } catch (err) {
      console.error('❌ Cron job failed:', err);
    }
  },
  {
    timezone: 'Europe/Rome', // Italy timezone
  },
);

// Cron job for processing expired subscriptions and issuing auto-refunds
cron.schedule("0 2 * * *", async () => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Ensure it only compares to the start of today

    // Find all subscriptions that are not activated and past activateExpireDate
    const expiredSubs = await MySubscription.find({
      status: "notActivate",
      activateExpireDate: { $lt: today },
      autoRefundAmount: { $gt: 0 },  // Only subscriptions with refund amount
      isExpired: false,
    }).session(session);

    if (expiredSubs.length === 0) {
      
      ("No expired subscriptions to process.");
      return;
    }

    const userUpdates = [];
    const subscriptionUpdates = [];
    const paymentUpdates = [];

    for (const sub of expiredSubs) {
      // Prepare user update for total credits
      userUpdates.push({
        updateOne: {
          filter: { _id: sub.user },
          update: { $inc: { totalCredits: sub.autoRefundAmount } },
        },
      });

      // Prepare subscription status update
      subscriptionUpdates.push({
        updateOne: {
          filter: { _id: sub._id },
          update: {
            status: "gotCredits",
            isExpired: true,
            autoExpireDate: today,
          },
        },
      });

      // Prepare subscription payment update if exists
      if (sub.subscriptionPaymentId) {
        paymentUpdates.push({
          updateOne: {
            filter: { _id: sub.subscriptionPaymentId },
            update: {
              userStatus: "gotCredits",
              gotCredits: sub.autoRefundAmount,
              autoExpireDate: today,
            },
          },
        });
      }

    }

    // Perform batch updates in one go
    if (userUpdates.length > 0) {
      await User.bulkWrite(userUpdates, { session });
    }

    if (subscriptionUpdates.length > 0) {
      await MySubscription.bulkWrite(subscriptionUpdates, { session });
    }

    if (paymentUpdates.length > 0) {
      await SubscriptionPayment.bulkWrite(paymentUpdates, { session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error processing auto refunds:", err);
  }
}, {
  timezone: "Europe/Rome", // Italy timezone
});

// Cron job for auto-stopping expired subscriptions
cron.schedule("0 4 * * *", async () => {
  try {
    console.log("🕒 Running auto-stop expired subscriptions cron job...");
    const count = await autoStopExpiredSubscriptions();
    console.log(`✅ Auto-stopped ${count} expired subscriptions`);
  } catch (error) {
    console.error("❌ Error in auto-stop cron:", error);
  }
});


// cron.schedule("0 0 * * *", async () => {
//   const adminData: any = getAdminData();

//   if (!adminData || !adminData._id) {
//     console.error("Admin data not found. Cannot send reminder notifications.");
//     return; // Stop the cron job
//   }

//   const usersWithoutListings = await User.find({
//     role: "organizer",
//     parentBusiness: null,
//     isDeleted: false,
//     isBlocked: false,
//   });

//   for (const user of usersWithoutListings) {
//     if (!user._id) continue; // Skip users without valid _id

//     await emitReminderNotificationToBusinessUser({
//       userId: adminData._id as mongoose.Types.ObjectId,
//       receiverId: user._id as mongoose.Types.ObjectId,
//       userMsg: {
//         name: "🚀 Create Your Business Listing",
//         image: (adminData.profileImage ?? "") as string,
//         text: `Hi ${user.name}, you haven’t created your first business yet. Start today and grow with Pianofesta! 🌟`,
//       },
//     });
//   }



// }, {
//   timezone: "Europe/Rome"
// });


// // প্রতিদিন Italy time অনুযায়ী 02:00 AM এ রান করবে
// cron.schedule("0 2 * * *", async () => {
//   console.log("🔄 Checking expired notActivate subscriptions for auto refund...");

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const today = new Date();

//     // 1️⃣ Find all subscriptions that are not activated and activateExpireDate passed
//     const expiredSubs = await MySubscription.find({
//       status: "notActivate",
//       activateExpireDate: { $lt: today },
//       autoRefundAmount: { $gt: 0 }, // only subscriptions with refund amount
//       isExpired: false
//     }).session(session);

//     for (const sub of expiredSubs) {
//       // 2️⃣ Add autoRefundAmount to user's totalCredits
//       await User.findByIdAndUpdate(
//         sub.user,
//         { $inc: { totalCredits: sub.autoRefundAmount } },
//         { session }
//       );

//       // 3️⃣ Update subscription status
//       await MySubscription.findByIdAndUpdate(
//         sub._id,
//         {
//           status: "gotCredits",
//           isExpired: true,
//           autoExpireDate: today
//         },
//         { session }
//       );

//       // 4️⃣ Update subscription payment if exists
//       if (sub.subscriptionPaymentId) {
//         await SubscriptionPayment.findByIdAndUpdate(
//           sub.subscriptionPaymentId,
//           { userStatus: "gotCredits", gotCredits: sub.autoRefundAmount, autoExpireDate: today },
//           { session }
//         );
//       }

//       console.log(`✅ Refunded ${sub.autoRefundAmount} credits to user ${sub.user} for subscription ${sub._id}`);
//     }

//     await session.commitTransaction();
//     session.endSession();
//     console.log("🎉 Cron job completed successfully.");
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("❌ Error processing auto refunds:", err);
//   }
// }, {
//   timezone: "Europe/Rome" // Italy timezone
// });


// Cron job - every 7 days at 10:00 AM Italy time
// Remind Apple login users who still haven't added their email
cron.schedule('0 5 */7 * *', async () => {
  try {
    const adminData = getAdminData();
    if (!adminData?._id) {
      console.error('Admin data not found. Cannot send Apple email reminder notifications.');
      return;
    }

    const adminId = new mongoose.Types.ObjectId(adminData._id);

    const appleUsersWithoutEmail = await User.find({
      loginWth: 'apple',
      $or: [{ email: { $exists: false } }, { email: null }, { email: '' }],
      isDeleted: false,
      isBlocked: false,
    }).select('_id');

    if (!appleUsersWithoutEmail.length) {
      console.log('No Apple users without email found.');
      return;
    }

    for (const user of appleUsersWithoutEmail) {
      await emitNotification({
        userId: adminId,
        receiverId: new mongoose.Types.ObjectId(user._id),
        userMsg: {
          image: adminData?.profileImage ?? '',
          name: 'Completa il tuo Profilo', // Complete your Profile
          text: 'Completa il tuo profilo aggiungendo il tuo indirizzo email prima di eliminare il tuo account.', // Please complete your profile by adding your email address.
        },
        type: 'adminProvide',
      });
    }

    console.log(`✅ Sent profile completion reminders to ${appleUsersWithoutEmail.length} Apple users.`);
  } catch (error) {
    console.error('❌ Error in Apple email reminder cron:', error);
  }
}, {
  timezone: 'Europe/Rome',
});

// Run every hour at minute 0



