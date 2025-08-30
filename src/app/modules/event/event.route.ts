import { Router } from 'express';
import { eventController } from './event.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import { verifyEventOwnership } from './event.utils';

const upload = fileUpload('./public/uploads/events');
const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.ORGANIZER),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'promotionImage', maxCount: 5 },
  ]),
  parseData(),
  eventController.createEvent
)

.patch(
  '/update/:eventId', 
  auth(USER_ROLE.ORGANIZER),
  verifyEventOwnership(),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'promotionImage', maxCount: 5 },
  ]),
  parseData(),
  eventController.updateEvent
)
  
.patch(
  '/activate/:eventId', 
  auth(USER_ROLE.ORGANIZER),
  eventController.activateEventById
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
  '/myList', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getMyEventList
)
  
.get(
  '/stats/:eventId', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getSpecificEventStats
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
  '/search',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getSearchEvents
)
  
.get(
  '/list',
  auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
  eventController.getAllEventList
)



.get(
    '/extra/:id', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  eventController.getExtraDataEventById
)
  
    .get(
    '/competation/:eventId',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    eventController.getCalculateCompetitionScore
  )
  
.get(
    '/:id', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    eventController.getEventById
)

export const eventRoutes = router;
