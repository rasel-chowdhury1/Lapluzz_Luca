import { Router } from 'express';
import { postCommunityEngagementStatsController } from './postCommunityEngagementStats.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.get(
    '/:postId',
    postCommunityEngagementStatsController.getStats
)
    .get(
        '/comments/:postId',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityEngagementStatsController.getPostCommunityComments
    )
    .post(
        '/like',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityEngagementStatsController.like
    )
    .post(
        '/unlike',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityEngagementStatsController.unlike
    )
    
    
    .post(
        '/comment',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityEngagementStatsController.comment
    );

export const PostCommunityEngagementStatsRoutes = router;
