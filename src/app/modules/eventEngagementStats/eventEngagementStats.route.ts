import { Router } from 'express';
import { eventEngagementStatsController } from './eventEngagementStats.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
    '/like',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    eventEngagementStatsController.like
)
    .post(
        '/unlike',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        eventEngagementStatsController.unlike
    )
    .post(
        '/comment',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        eventEngagementStatsController.comment)

    .post(
        '/comment/reply', 
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
        eventEngagementStatsController.replyCommentofSpecificComment
    )
    
    .get(
        "/comments/:eventId",
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        eventEngagementStatsController.getEventComments
    )
    
    .get(
        '/:eventId',
        eventEngagementStatsController.getStats
    
);

export const eventEngagementStatsRoutes = router;
