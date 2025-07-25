
import Subscription from './subcription.model';
import { ISubscription } from './subscription.interface';

const createSubscription = async (payload: ISubscription) => {
  return Subscription.create(payload);
};

const getAllSubscriptions = async () => {
  return Subscription.find().sort({ priorityLevel: 1 });
};

const getSubscriptionsByType = async (type: string) => {
  return Subscription.find({ type }).sort({ priorityLevel: 1 });
};

const getSubscriptionById = async (id: string) => {
  return Subscription.findById(id);
};

const deleteSubscription = async (id: string) => {
  return Subscription.findByIdAndDelete(id);
};

export const SubscriptionService = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionsByType,
  getSubscriptionById,
  deleteSubscription,
};
