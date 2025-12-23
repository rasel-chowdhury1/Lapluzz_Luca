
import { Router } from 'express';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import { USER_ROLE } from '../user/user.constants';
import { businessController } from './business.controller';
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
    { name: 'promotionImage', maxCount: 1 },
  ]),
  parseData(),
  businessController.createBusiness
)

  .post(
    "/useCredits",
    auth(USER_ROLE.USER),
    
  )


  .patch(
    '/update/:businessId',
    auth(USER_ROLE.ORGANIZER),
    verifyBusinessOwnership(),
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
      { name: 'promotionImage', maxCount: 1 },
    ]),
    parseData(),
    businessController.updateBusiness
)
  
  .patch(
    '/activate/:businessId',
    auth(USER_ROLE.ORGANIZER),
    businessController.activateBusinessById
  )

  .patch(
    "/block/:businessId",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    businessController.blockedBusinessByUserId
  )

  .delete(
    '/:id',
    auth(USER_ROLE.ORGANIZER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
    businessController.deleteBusiness
  )

  .get(
    '/',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getAllBusiness
)

// this api used on home page to get business by location for user and organizer both
  .get(
    '/location',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getAllBusinessByLocation
)

  .get(
    '/guest/location',
    businessController.getAllBusinessByLocationGuest
)


// this api used on home page to get exclusive business by location for user and organizer both
  .get(
    '/exclusive/location',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getExclusiveBusinessByLocation
)


  .get(
    '/list',
    auth(USER_ROLE.ADMIN),
    businessController.getAllBusinessList
)
  

  .get(
    '/my',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getMyBusiness
  )

  .get(
    "/my/nameList",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getMyBusinessNameList
  )

  .get(
    "/categoryBusinessNameList",
    businessController.getAllCategoryAndBusinessName
  )

  .get(
    "/allNameList",
    businessController.getAllBusinessesNameList
  )

  .get(
    '/myParent',
    auth(USER_ROLE.ORGANIZER),
    businessController.getMyParentBusiness
  )

  .get(
    '/myList',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getMyBusinessList
  )

  .get(
    '/competation/:businessId',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.getCalculateCompetitionScore
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
    businessController.searchBusiness
)

  .get(
    '/search/location',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.searchBusinessesByLocation
)
  
  .get(
    '/wizard-search',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.wizardSearchBusiness
  )
  
  .get(
    '/filter',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    businessController.filterSearchBusinesses
  )

    .get(
      '/all-business-nameList',
      auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
      businessController.getAllBusinessQueryNameList
    )


    .post(
      "/useCredits"
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