import mongoose from "mongoose";
import AppError from "../../error/AppError";
import MySubscription from "./mySubscription.mdel";

const getMySubscriptions = async (userId: string) => {
  const subscriptions = await MySubscription.find({ user: userId })
    .populate("subscription")
    .populate("subscriptionFor");
  return subscriptions;
};

const activateSubscription = async (userId: string, subId: string) => {
  const subscription = await MySubscription.findById(subId);
  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  
 if (String(subscription.user) !== String(userId)) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to activate this subscription");
  }

  subscription.status = "activate";
  await subscription.save();
  return subscription;
};

const stopSubscription = async (userId: string, subId: string) => {
  const subscription = await MySubscription.findById(subId);
  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
  }
if (String(subscription.user) !== String(userId)) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to activate this subscription");
  }
  subscription.status = "stop";
  await subscription.save();
  return subscription;
};

export const mySubscriptionService = {
  getMySubscriptions,
  activateSubscription,
  stopSubscription
}