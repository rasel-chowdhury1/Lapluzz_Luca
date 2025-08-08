import express from 'express';
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionsByType,
  getSubscriptionById,
  deleteSubscription,
  updateSubscriptionById,
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
  .patch(
    "/update/:subId",
    auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
    updateSubscriptionById
)
  
  .delete(
    '/:id',
    deleteSubscription
  );

export const SubscriptionRoutes = router;
