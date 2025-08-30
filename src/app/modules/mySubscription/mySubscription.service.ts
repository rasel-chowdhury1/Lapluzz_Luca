import mongoose from "mongoose";
import AppError from "../../error/AppError";
import MySubscription from "./mySubscription.mdel";
import httpStatus from 'http-status';
import SubscriptionPayment from "../subscriptionPayment/subscriptionPayment.model";
import Subscription from "../subscription/subcription.model";
import { User } from "../user/user.models";
import dayjs from 'dayjs';
import Business from "../business/business.model";
import Event from "../event/event.model";
import Job from "../job/job.model";

const getMySubscriptions = async (userId: string) => {
  const subscriptions = await MySubscription.find({ user: userId, status: {$in: ["notActivate","activate"]} })
    .populate("subscription")
    .populate("subscriptionFor", "name")
    .sort({ status: "asc", createdAt: -1 });
  return subscriptions;
};

const getMySubscriptionsHistory = async (userId: string) => {
  const subscriptions = await MySubscription.find({ user: userId })
    .populate("subscription")
    .populate("subscriptionFor", "name")
    .sort({ createdAt: -1 });;
  return subscriptions;
};

const activateSubscription = async (userId: string, mySubId: string) => {
  const session = await mongoose.startSession(); // Start the transaction session
  session.startTransaction();

  try {
    // Fetch the subscription document
    const mySubscription = await MySubscription.findById(mySubId).session(session);
    console.log({mySubscription})
    if (!mySubscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    // Authorization check
    if (String(mySubscription.user) !== String(userId)) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to activate this subscription");
    }

    // Check if the subscription can be activated
    if (mySubscription.status !== "notActivate") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Subscription is already in '${mySubscription.status}' state and cannot be activated again`
      );
    }

    // Update SubscriptionPayment document if the subscription was successfully activated
    const result = await MySubscription.findByIdAndUpdate(
      mySubId,
      { status: "activate" },
      { session }
    );
    if (!result) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save subscription");
    }

    // Update SubscriptionPayment document if the subscription was successfully activated
    await SubscriptionPayment.findByIdAndUpdate(
      mySubscription.subscriptionPaymentId,
      { userStatus: "activate" },
      { session }
    );

    // Handle business-related subscription logic
    if (mySubscription.subscriptionForType === "Business") {
      const businessResult = await Business.findByIdAndUpdate(
        mySubscription.subscriptionFor,
        {
          isSubscription: true,
          subscriptionPriorityLevel: mySubscription.subscriptionPriorityLevel,
          subscriptionType: mySubscription.subscriptionType,
          subcriptionStatus: "activated",
          expireSubscriptionTime: mySubscription.expireDate,
        },
        { session }
      );
      if (!businessResult) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update business subscription");
      }
    }

    
     // Handle event-related subscription logic
    if (mySubscription.subscriptionForType === "Event") {
      const eventResult = await Event.findByIdAndUpdate(
        mySubscription.subscriptionFor,
        {
          isSubscription: true,
          subscriptionPriorityLevel: mySubscription.subscriptionPriorityLevel,
          subscriptionType: mySubscription.subscriptionType,
          subscriptionStatus: "activated",
          expireSubscriptionTime: mySubscription.expireDate,
        },
        { session }
      );
      if (!eventResult) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update event subscription");
      }
    }

        // Handle job-related subscription logic
    if (mySubscription.subscriptionForType === "Job") {
      const jobResult = await Job.findByIdAndUpdate(
        mySubscription.subscriptionFor,
        {
          isSubscription: true,
          subscriptionPriorityLevel: mySubscription.subscriptionPriorityLevel,
          subscriptionType: mySubscription.subscriptionType,
          subscriptionStatus: "activated",
          expireSubscriptionTime: mySubscription.expireDate,
        },
        { session }
      );
      if (!jobResult) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update job subscription");
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return mySubscription;
  } catch (error) {

    console.log(error.message)
    // If an error occurs, abort the transaction and rollback
    await session.abortTransaction();
    session.endSession();
    throw error; // Rethrow the error after rolling back
  }
};



const stopSubscription = async (userId: string, mySubId: string) => {
  const session = await mongoose.startSession(); // Start a session for the transaction
  session.startTransaction();

  try {
    // 1. Fetch the subscription document
    const subscription = await MySubscription.findById(mySubId).session(session);
    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    if (String(subscription.user) !== String(userId)) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to stop this subscription");
    }

    if (subscription.status !== 'activate') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot stop a subscription that is in '${subscription.status}' state`
      );
    }

    // 2. Fetch the subscription plan to get the price
    const plan = await Subscription.findById(subscription.subscription).session(session);
    if (!plan) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    const selectedOption = plan.options[subscription.subscriptionOptionIndex];
    if (!selectedOption) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid subscription option index");
    }

    // 3. Calculate unused credits
    const today = dayjs();
    const expiryDate = dayjs(subscription.expiryDate);
    const unusedDays = expiryDate.diff(today, 'day');

    if (unusedDays > 0) {
      const totalDays = selectedOption.expirationDays || 0;
      const perDayPrice = selectedOption.price / totalDays;
      const creditAmount = perDayPrice * unusedDays;

      // 4. Add credits to the user account
      await User.findByIdAndUpdate(subscription.user, {
        $inc: { totalCredits: creditAmount }
      }).session(session);
    }

    // // 5. Stop the subscriptio
    // subscription.status = "gotCredits";
    // const result = await subscription.save({ session });n

     // Update SubscriptionPayment document if the subscription was successfully activated
    const result = await MySubscription.findByIdAndUpdate(
      mySubId,
      { status: "gotCredits" },
      { session }
    );
    if (!result) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save subscription");
    }

    if (!result) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to stop subscription");
    }

    // 6. Update subscription payment status
    await SubscriptionPayment.findByIdAndUpdate(subscription.subscriptionPaymentId, { userStatus: "gotCredits" }).session(session);

    // 7. Update business subscription if applicable
    if (subscription.subscriptionForType === "Business") {
      await Business.findByIdAndUpdate(subscription.subscriptionFor, {
        isSubscription: false,
        subscriptionStatus: "deactivated",
        expireSubscriptionTime: null,
        subscriptionEndTime: today.toISOString()
      }).session(session);
    }

    // 8. Update event-related subscription if applicable
    if (subscription.subscriptionForType === "Event") {
      await Event.findByIdAndUpdate(subscription.subscriptionFor, {
        subscriptionStatus: "deactivated",
        subscriptionEndTime: today.toISOString(),
      }).session(session);
    }

    // 9. Update job-related subscription if applicable
    if (subscription.subscriptionForType === "Job") {
      await Job.findByIdAndUpdate(subscription.subscriptionFor, {
        subscriptionStatus: "deactivated",
        subscriptionEndTime: today.toISOString(),
      }).session(session);
    }

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    return subscription;
  } catch (error) {
    // If any error occurs, abort the transaction and rollback all changes
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// const stopSubscription = async (userId: string, mySubId: string) => {
//   const subscription = await MySubscription.findById(mySubId);
//   if (!subscription) {
//     throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
//   }

//   if (String(subscription.user) !== String(userId)) {
//     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to stop this subscription");
//   }

//   if (subscription.status !== 'activate') {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       `Cannot stop a subscription that is in '${subscription.status}' state`
//     );
//   }

//   // 1. Fetch the subscription plan to get the price
//   const plan = await Subscription.findById(subscription.subscription);
//   if (!plan) {
//     throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
//   }

//   const selectedOption = plan.options[subscription.subscriptionOptionIndex];
//   if (!selectedOption) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Invalid subscription option index");
//   }

//   // 2. Calculate unused credits
//   const today = dayjs();
//   const expiryDate = dayjs(subscription.expiryDate);
//   const unusedDays = expiryDate.diff(today, 'day');

//   if (unusedDays > 0) {
//     const totalDays = selectedOption.expirationDays || 0;
//     const perDayPrice = selectedOption.price / totalDays;
//     const creditAmount = perDayPrice * unusedDays;

//     // 3. Add credits to the user account
//     await User.findByIdAndUpdate(subscription.user, {
//       $inc: { totalCredits: creditAmount }
//     });
//   }

//   // 4. Stop the subscription
//   subscription.status = "gotCredits";
//   const result = await subscription.save();

//   if(result) {
//     await SubscriptionPayment.findByIdAndUpdate(subscription.subscriptionPaymentId, {userStatus: "gotCredits"})
//   }

//   return subscription;
// };



export const mySubscriptionService = {
  getMySubscriptions,
  getMySubscriptionsHistory,
  activateSubscription,
  stopSubscription
}