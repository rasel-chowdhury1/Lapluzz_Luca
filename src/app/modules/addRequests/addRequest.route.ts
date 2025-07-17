import { Router } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { addRequestsController } from './addRequest.controller';

const router = Router();

router.post(
  '/',
  auth(USER_ROLE.ORGANIZER),
  addRequestsController.createAddRequests,
);
router.patch(
  '/approve/:id',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.approvedAddRequests,
);
router.patch(
  '/reject/:id',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.rejectAddRequests,
);
router.patch(
  '/:id',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.updateAddRequests,
);
router.delete(
  '/:id',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.deleteAddRequests,
);
router.get(
  '/:id',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.getAddRequestsById,
);
router.get(
  '/',
  auth(
    USER_ROLE.ORGANIZER,
    USER_ROLE.ADMIN
  ),
  addRequestsController.getAllAddRequests,
);

export const addRequestsRoutes = router;