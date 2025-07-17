import { Router } from 'express';
import { eventProfileViewsController } from './eventProfileViews.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router
    .post(
    '/add',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    eventProfileViewsController.addView
    )

    .get(
        '/:eventId',
        eventProfileViewsController.getViews
    );

export const EventProfileViewsRoutes = router;
