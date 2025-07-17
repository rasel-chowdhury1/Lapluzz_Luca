import { Router } from 'express';
import { businessReviewController } from './businessReview.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
  businessReviewController.createReview
);

router.get(
  '/business/:businessId',
  businessReviewController.getReviewsByBusiness
);

router.delete(
  '/:id',
  auth(USER_ROLE.USER),
  businessReviewController.deleteReview
);

export const businessReviewRoutes = router;
