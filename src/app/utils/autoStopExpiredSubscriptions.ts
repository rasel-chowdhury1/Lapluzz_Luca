import mongoose from "mongoose";
import MySubscription from "../modules/mySubscription/mySubscription.model";
import dayjs from "dayjs";
import Business from "../modules/business/business.model";
import Event from "../modules/event/event.model";
import Job from "../modules/job/job.model";
import { User } from "../modules/user/user.models";

export const autoStopExpiredSubscriptions = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const today = dayjs().toDate();

    // 1️⃣ Find all active subscriptions that have expired
    const expiredSubscriptions = await MySubscription.find({
      status: "activate",
      expireDate: { $lte: today },
    }).session(session);

    if (expiredSubscriptions.length === 0) {
      console.log("No expired subscriptions found.");
      await session.endSession();
      return 0; // Exit early if no expired subscriptions
    }

        // 2️⃣ Update all related users subscriptionStatus to "none"
    const userUpdates = expiredSubscriptions.map((sub) => ({
      updateOne: {
        filter: { _id: sub.user },
        update: { subscriptionStatus: "none" },
      },
    }));
    await User.bulkWrite(userUpdates, { session });


    // 2️⃣ Prepare bulk updates for subscriptions and related entities
    const subscriptionUpdates = [] as any;
    const entityUpdates = [] as any;

    expiredSubscriptions.forEach((sub) => {
      // Update subscription status to "stop" and set stopDate
      subscriptionUpdates.push({
        updateOne: {
          filter: { _id: sub._id },
          update: {
            status: "stop",
            stopDate: today,
          },
        },
      });

      // Prepare entity update based on subscriptionForType
      const entityUpdate = {
        isSubscription: false,
        subscriptionStatus: "deactivated",
        subscriptionEndTime: today.toISOString(),
      };

      if (sub.subscriptionForType === "Business") {
        entityUpdates.push({
          updateOne: {
            filter: { _id: sub.subscriptionFor },
            update: entityUpdate,
          },
        });
      }

      if (sub.subscriptionForType === "Event") {
        entityUpdates.push({
          updateOne: {
            filter: { _id: sub.subscriptionFor },
            update: entityUpdate,
          },
        });
      }

      if (sub.subscriptionForType === "Job") {
        entityUpdates.push({
          updateOne: {
            filter: { _id: sub.subscriptionFor },
            update: entityUpdate,
          },
        });
      }
    });

    // 3️⃣ Perform bulk updates in parallel for subscriptions and related entities
    await Promise.all([
      MySubscription.bulkWrite(subscriptionUpdates, { session }), // Bulk update subscriptions
      Business.bulkWrite(entityUpdates.filter((u: any) => u.updateOne.filter && u.updateOne.update.subscriptionForType === 'Business'), { session }), // Bulk update Businesses
      Event.bulkWrite(entityUpdates.filter((u: any) => u.updateOne.filter && u.updateOne.update.subscriptionForType === 'Event'), { session }), // Bulk update Events
      Job.bulkWrite(entityUpdates.filter((u: any) => u.updateOne.filter && u.updateOne.update.subscriptionForType === 'Job'), { session }), // Bulk update Jobs
    ]);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log(`✅ Auto-stopped ${expiredSubscriptions.length} expired subscriptions`);
    return expiredSubscriptions.length;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error in auto-stopping subscriptions:", error);
    throw error;
  }
};
