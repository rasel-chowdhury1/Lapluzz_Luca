import express from 'express';
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionsByType,
  getSubscriptionById,
  deleteSubscription,
} from './subscription.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = express.Router();

router.post(
  '/create',
  auth(USER_ROLE.ADMIN),
  createSubscription
)

  .get(
    '/',
    getAllSubscriptions
  )
  .get(
    '/type/:type',
    getSubscriptionsByType
  )
  .get(
    '/:id',
    getSubscriptionById
  )
  .delete(
    '/:id',
    deleteSubscription
  );

export const SubscriptionRoutes = router;
