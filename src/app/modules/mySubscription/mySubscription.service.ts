import mongoose from "mongoose";
import AppError from "../../error/AppError";
import MySubscription from "./mySubscription.mdel";
import httpStatus from 'http-status';
import SubscriptionPayment from "../subscriptionPayment/subscriptionPayment.model";
import Subscription from "../subscription/subcription.model";
import { User } from "../user/user.models";
import dayjs from 'dayjs';

const getMySubscriptions = async (userId: string) => {
  const subscriptions = await MySubscription.find({ user: userId })
    .populate("subscription")
    .populate("subscriptionFor", "name");
  return subscriptions;
};

const activateSubscription = async (userId: string, mySubId: string) => {
  const subscription = await MySubscription.findById(mySubId);
  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  
 if (String(subscription.user) !== String(userId)) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to activate this subscription");
  }

  if (subscription.status !== "notActivate") {
     throw new AppError(
    httpStatus.BAD_REQUEST,
    `Subscription is already in '${subscription.status}' state and cannot be activated again`
  );
  }

  subscription.status = "activate";
  const result= await subscription.save();
  if(result){
    await SubscriptionPayment.findByIdAndUpdate(subscription.subscriptionPaymentId, {userStatus: "activate"})
  }
  return subscription;
};

const stopSubscription = async (userId: string, mySubId: string) => {
  const subscription = await MySubscription.findById(mySubId);
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

  // 1. Fetch the subscription plan to get the price
  const plan = await Subscription.findById(subscription.subscription);
  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
  }

  const selectedOption = plan.options[subscription.subscriptionOptionIndex];
  if (!selectedOption) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid subscription option index");
  }

  // 2. Calculate unused credits
  const today = dayjs();
  const expiryDate = dayjs(subscription.expiryDate);
  const unusedDays = expiryDate.diff(today, 'day');

  if (unusedDays > 0) {
    const totalDays = selectedOption.expirationDays || 0;
    const perDayPrice = selectedOption.price / totalDays;
    const creditAmount = perDayPrice * unusedDays;

    // 3. Add credits to the user account
    await User.findByIdAndUpdate(subscription.user, {
      $inc: { totalCredits: creditAmount }
    });
  }

  // 4. Stop the subscription
  subscription.status = "gotCredits";
  const result = await subscription.save();

  if(result) {
    await SubscriptionPayment.findByIdAndUpdate(subscription.subscriptionPaymentId, {userStatus: "gotCredits"})
  }

  return subscription;
};

// const stopSubscription = async (userId: string, mySubId: string) => {
//   const subscription = await MySubscription.findById(mySubId);
//   if (!subscription) {
//     throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
//   }
// if (String(subscription.user) !== String(userId)) {
//     throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to activate this subscription");
//   }


//   if (subscription.status !== 'activate') {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       `Cannot stop a subscription that is in '${subscription.status}' state`
//     );
//   }

//   subscription.status = "stop";
//   await subscription.save();
//   return subscription;
// };

export const mySubscriptionService = {
  getMySubscriptions,
  activateSubscription,
  stopSubscription
}