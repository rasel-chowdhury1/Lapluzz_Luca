import { Router } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { businessEngagementStatsController } from './businessEngaagementStats.controller';

const router = Router();

router.post(
    '/like', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
    businessEngagementStatsController.like
)
.post(
    '/unlike', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
    businessEngagementStatsController.unlike
)
.post(
    '/follow', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
    businessEngagementStatsController.follow
)
.post(
    '/unfollow', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
    businessEngagementStatsController.unfollow
)
.post(
    '/comment', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
    businessEngagementStatsController.comment
)
    
.get(
    "/comments/:businessId", businessEngagementStatsController.getBusinessComments)
    
.get(
    '/:businessId', 
    businessEngagementStatsController.getStats
);

export const businessEngagementStatsRoutes = router;
