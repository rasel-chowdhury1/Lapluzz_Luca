import { Router } from 'express';
import { pollCommunityController } from './pollCommunity.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router
    .post(
        '/add',
        auth(USER_ROLE.USER),
        pollCommunityController.createPoll
    )
    .get(
        '/',
        pollCommunityController.getAllPolls
)
    
    .get(
        '/latest',
        auth(USER_ROLE.USER,USER_ROLE.ORGANIZER),
        pollCommunityController.getLatestPolls
)
    .get(
        '/myPolls',
        auth(USER_ROLE.USER,USER_ROLE.ORGANIZER),
        pollCommunityController.getMyLatestPolls
)
    
    .get(
        '/:pollId',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        pollCommunityController.getPollById
    )
    .patch(
        '/vote',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        pollCommunityController.vote
    )
    .delete(
        '/:id',
        auth(USER_ROLE.USER), pollCommunityController.deletePoll
    );

export const pollCommunityRoutes = router;