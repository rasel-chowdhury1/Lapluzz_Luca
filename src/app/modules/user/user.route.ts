import { Router } from 'express';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import validateRequest from '../../middleware/validateRequest';
import { resentOtpValidations } from '../otp/otp.validation';
import { USER_ROLE } from './user.constants';
import { userController } from './user.controller';
import { userValidation } from './user.validation';
const upload = fileUpload('./public/uploads/profile');

export const userRoutes = Router();

userRoutes
  .post(
    '/create',
    validateRequest(userValidation?.userValidationSchema),
    userController.createUser,
  )
  .post(
    '/create/admin',
    auth(USER_ROLE.ADMIN),
    validateRequest(userValidation?.adminValidationSchema),
    userController.adminCreateAdmin,
  )

  .post(
    '/create-user-verify-otp',
    validateRequest(resentOtpValidations.verifyOtpZodSchema),
    userController.userCreateVarification,
  )

  .patch(
    '/update-my-profile',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    upload.single('image'),
    parseData(),
    userController.updateMyProfile,
  )

  .patch(
    '/block/:userId',
    auth('admin'),
    userController.blockedUser,
  )

  .patch(
    '/delete/:userId',
    auth('admin'),
    userController.deletedUser,
  )


  .post(
    '/complete',
    auth('user', "organizer", "admin"),
    userController.completedProfile,
  )

  .get(
  '/adminList',
  auth(USER_ROLE.ADMIN),
  userController.getSuperAdminLists,
  )
  
  .get(
    '/my-profile',
    auth(
      USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE. ADMIN
    ),
    userController.getMyProfile,
  )



  .get(
    '/admin-profile',
    auth(
      'admin'
    ),
    userController.getAdminProfile,
  )
  .get('/all-users', auth("admin"), userController.getAllUsersList)

  .get(
    '/all-users-nameList',
    auth(USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    userController.getAllUserQueryNameList
  )

  .get(
    '/all-business-users',
    auth("admin"),
    userController.getAllBusinessUsers
  )

  .get("/all-users-overview", auth("admin"), userController.getAllUsersOverview)

  .get(
    "/dashboard",
    auth("admin"),
    userController.getDashboardOverview
  )

  .get(
    "/users-overview",
    auth("admin"),
    userController.getUsersOverview
  )

  .get(
    "/earning-overview",
    auth("admin"),
    userController.getEarningOverview
  )


  .get(
    "/myReferrals",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER,USER_ROLE.ADMIN),
    userController.myReferrals
  )

  .get(
    "/myTotalCredits",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER,USER_ROLE.ADMIN),
    userController.getMyTotalCredits
  )



  .get(
    '/:id',
    auth("user", "admin"),
    userController.getUserById
  )




  .delete(
    '/delete-my-account',
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER
    ),
    userController.deleteMyAccount,
  )
  .delete(
    '/delete/:userId',
    auth(USER_ROLE.ADMIN
    ),
    userController.deleteSuperAdmin,
  );

// export default userRoutes;
