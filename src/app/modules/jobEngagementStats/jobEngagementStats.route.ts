import { Router } from 'express';
import { jobEngagementStatsController } from './jobEngagementStats.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/comment',
  auth(USER_ROLE.USER),
  jobEngagementStatsController.addComment
);

router.get(
  '/:jobId',
  jobEngagementStatsController.getEngagementStats
);

export const jobEngagementStatsRoutes = router;
