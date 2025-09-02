import {  createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import colors from 'colors'; // Ensure correct import
import config from './app/config';
import createDefaultAdmin from './app/DB/createDefaultAdmin';
import { emitReminderNotificationToBusinessUser, initSocketIO } from './socketIo';
import { logger } from './app/utils/logger';
import cron from 'node-cron';
import { User } from './app/modules/user/user.models';
import { sendReminderNotification } from './app/utils/sentNotificationByFcmToken';
import { getAdminData } from './app/DB/adminStore';

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


    // console.log('config.database_url', config.database_url);


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
    console.log(err);
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


cron.schedule("0 0 * * *", async () => {
  const adminData: any = getAdminData();

  if (!adminData || !adminData._id) {
    console.error("Admin data not found. Cannot send reminder notifications.");
    return; // Stop the cron job
  }

  const usersWithoutListings = await User.find({
    role: "organizer",
    parentBusiness: null,
    isDeleted: false,
    isBlocked: false,
  });

  for (const user of usersWithoutListings) {
    if (!user._id) continue; // Skip users without valid _id

    await emitReminderNotificationToBusinessUser({
      userId: adminData._id as mongoose.Types.ObjectId,
      receiverId: user._id as mongoose.Types.ObjectId,
      userMsg: {
        name: "🚀 Create Your Business Listing",
        image: (adminData.profileImage ?? "") as string,
        text: `Hi ${user.name}, you haven’t created your first business yet. Start today and grow with Pianofesta! 🌟`,
      },
    });
  }
});