import { Router } from 'express';
import { eventController } from './event.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';

const upload = fileUpload('./public/uploads/events');
const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.ORGANIZER),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'promotion', maxCount: 5 },
  ]),
  parseData(),
  eventController.createEvent
)

.patch(
  '/update/:id', 
  auth(USER_ROLE.ORGANIZER),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'promotion', maxCount: 5 },
  ]),
  parseData(),
  eventController.updateEvent
)

.delete(
    '/:id', 
    eventController.deleteEvent
)

.get(
    '/', 
    eventController.getAllEvents
)
  
.get(
  '/my', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getMyEvents
)

.get(
    '/sub', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    eventController.getSubscriptionEvents
)

.get(
  '/all',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getUnsubscriptionEvents
)



.get(
    '/:id', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    eventController.getEventById
)

export const eventRoutes = router;
