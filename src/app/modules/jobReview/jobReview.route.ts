import { Router } from 'express';
import { jobReviewController } from './jobReview.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
  jobReviewController.createReview
)

.get(
  '/job/:jobId',
  jobReviewController.getReviewsByJob
)

.delete(
  '/:id',
  auth(USER_ROLE.USER),
  jobReviewController.deleteReview
);

export const jobReviewRoutes = router;
