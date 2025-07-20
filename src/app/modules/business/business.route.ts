
import { Router } from 'express';
import { businessController } from './business.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import { verifyBusinessOwnership } from './business.utils';
const upload = fileUpload('./public/uploads/business');
const router = Router();

router.post(
    '/create',
    auth(USER_ROLE.ORGANIZER),
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
      { name: 'promotion', maxCount: 1 },
    ]),
    parseData(),
    businessController.createBusiness
)


.patch(
  '/update/:businessId', 
  auth(USER_ROLE.ORGANIZER),
  verifyBusinessOwnership(),
   upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
      { name: 'promotion', maxCount: 1 },
    ]),
    parseData(),
  businessController.updateBusiness
)

.delete(
  '/:id', 
  businessController.deleteBusiness
)

.get(
  '/', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  businessController.getAllBusiness
)
  
  .get(
  '/my', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  businessController.getMyBusiness
)

  .get(
  '/stats/:businessId', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  businessController.getSpecificBusinessStats
)

.get(
  '/category/:categoryId', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
  businessController.getSpecificCategoryBusiness
)

.get(
  '/unSubs', 
  businessController.getUnsubscriptionBusiness
)

.get(
  '/subs', 
  businessController.getSubscrptionBusiness
)
  
  .get(
  '/map', 
  businessController.getBusinessAndEventsForMap
)
  
.get(
  '/search',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN), 
  businessController.searchBusinessController
)  

.get(
  '/extra/:id',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN), 
  businessController.getExtraBusinessDataById
)

.get(
  '/:id',
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN), 
  businessController.getBusinessById
);


export const businessRoutes = router;