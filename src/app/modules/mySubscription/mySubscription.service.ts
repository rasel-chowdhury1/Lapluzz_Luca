import mongoose from "mongoose";
import AppError from "../../error/AppError";
import MySubscription from "./mySubscription.mdel";
import httpStatus from 'http-status';

const getMySubscriptions = async (userId: string) => {
  const subscriptions = await MySubscription.find({ user: userId })
    .populate("subscription")
    .populate("subscriptionFor", "name");
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

  if (subscription.status !== "notActivate") {
     throw new AppError(
    httpStatus.BAD_REQUEST,
    `Subscription is already in '${subscription.status}' state and cannot be activated again`
  );
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


  if (subscription.status !== 'activate') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot stop a subscription that is in '${subscription.status}' state`
    );
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