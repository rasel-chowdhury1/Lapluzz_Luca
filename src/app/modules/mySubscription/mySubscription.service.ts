import mongoose from "mongoose";
import AppError from "../../error/AppError";
import MySubscription from "./mySubscription.model";
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

      const subscriptionsWithPotentialCredits = subscriptions.map((sub) => {
    let potentialCredits = 0;

    // Only calculate if subscription is active
    if (sub.status === "activate") {
      const today = dayjs();
      const expiryDate = dayjs(sub.expireDate);
      const unusedDays = expiryDate.diff(today, "day");

      // Get subscription option price and expiration days
      const plan = sub.subscription as any; // populated subscription
      const selectedOption = plan.options[(sub as any).subscriptionOptionIndex];
      if (selectedOption && unusedDays > 0) {
        const totalDays = selectedOption.expirationDays || 0;
        const perDayPrice = selectedOption.price / totalDays;
        potentialCredits = perDayPrice * unusedDays;
      }
    }

    return {
      ...sub.toObject(),
      potentialCredits,
    };
  });

  return subscriptionsWithPotentialCredits;
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

        // 🔹 Check if there is already an active subscription for the same "subscriptionFor"
    const activeSubscription = await MySubscription.findOne({
      subscriptionFor: mySubscription.subscriptionFor,
      subscriptionForType: mySubscription.subscriptionForType,
      status: "activate", // only active ones
      _id: { $ne: mySubId }, // ignore current subscription
    }).session(session);



    if (activeSubscription) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You already have an active subscription for this entity. Please stop it before activating a new one."
      );
    }


        // ✅ Calculate expireDate dynamically
    const activateDate = new Date(); // today
    const expireDate = new Date();

    const subscriptionDays = mySubscription.subcriptionDays || 30; // default if not set
    expireDate.setDate(activateDate.getDate() + subscriptionDays);

    // Update MySubscription
    const result = await MySubscription.findByIdAndUpdate(
      mySubId,
      {
        status: "activate",
        activateDate,
        expireDate,
        activateExpireDate: expireDate,
      },
      { session, new: true }
    );
    if (!result) throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save subscription");

    // Update SubscriptionPayment document if the subscription was successfully activated
    await SubscriptionPayment.findByIdAndUpdate(
      mySubscription.subscriptionPaymentId,
      { userStatus: "activate",
        activateDate,
        expireDate,
        activateExpireDate: expireDate,
      },
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
          subBlueVerifiedBadge: mySubscription.subBlueVerifiedBadge,
          subscriptionStatus: "activated",
          expireSubscriptionTime: expireDate,
        },
        { new: true, session }
      );

      console.log("business result =>>>> ", businessResult)
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
          expireSubscriptionTime: expireDate,
        },
        { new: true, session }
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
          expireSubscriptionTime: expireDate,
        },
        { new: true, session }
      );
      if (!jobResult) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update job subscription");
      }
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return mySubscription;
  } catch (error ) {

    console.log((error as any).message)
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

    console.log("my subscription of stop =>>> ", subscription )
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


    console.log("Subscription plan ==>>>>>>> ", plan)
    if (!plan) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    const selectedOption = plan.options[(subscription as any).subscriptionOptionIndex];

    console.log("selected option =>>>> ", selectedOption)
    if (!selectedOption) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid subscription option index");
    }

    // 3. Calculate unused credits
    const today = dayjs();
    const expiryDate = dayjs(subscription.expireDate);
    const unusedDays = expiryDate.diff(today, 'day');

    console.log("today expiryDate unuseddays ==>>> ", today,expiryDate,unusedDays)
    let creditAmount;
    if (unusedDays > 0) {
      const totalDays = selectedOption.expirationDays || 0;
      const perDayPrice = selectedOption.price / totalDays;
      creditAmount = perDayPrice * unusedDays;

      console.log( "credite amount ->>> ",{creditAmount})

      // 4. Add credits to the user account
      await User.findByIdAndUpdate(subscription.user, {
        $inc: { totalCredits: creditAmount }
      }).session(session);
    }



     // Update SubscriptionPayment document if the subscription was successfully activated
    const result = await MySubscription.findByIdAndUpdate(
      mySubId,
      { status: "gotCredits", gotCredits: creditAmount,stopDate: today.toDate() },
      { session }
    );

    if (!result) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to save subscription");
    }

    if (!result) {
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to stop subscription");
    }

    // 6. Update subscription payment status
    await SubscriptionPayment.findByIdAndUpdate(subscription.subscriptionPaymentId, { userStatus: "gotCredits",gotCredits: creditAmount, stopDate: today.toDate()}).session(session);

    // 7. Update business subscription if applicable
    if (subscription.subscriptionForType === "Business") {
     const businessResult = await Business.findByIdAndUpdate(subscription.subscriptionFor, {
        isSubscription: false,
        subscriptionStatus: "deactivated",
        expireSubscriptionTime: null,
        subscriptionEndTime: today.toISOString()
      }, {new: true}).session(session);

      console.log("stop business result =>>> ", businessResult)
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