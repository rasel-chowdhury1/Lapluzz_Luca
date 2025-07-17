import { Router } from 'express';
import { eventReviewController } from './eventReview.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
  eventReviewController.createReview
);

router.get(
  '/event/:eventId',
  eventReviewController.getReviewsByEvent
);

router.delete(
  '/:id',
  auth(USER_ROLE.USER),
  eventReviewController.deleteReview
);

export const eventReviewRoutes = router;
