import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { EventInterestController } from './eventInterest.controller';

const router = express.Router();

router.patch(
    '/add/:eventId',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    EventInterestController.addUserInterest
)
    
    .get(
    '/:eventId',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    EventInterestController.getInterestedUsers
);

export const EventInterestRoutes = router;
