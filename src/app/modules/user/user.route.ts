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
    '/create-user-verify-otp',
    validateRequest(resentOtpValidations.verifyOtpZodSchema),
    userController.userCreateVarification,
  )

  .patch(
    '/update-my-profile',
    auth('user', USER_ROLE.ORGANIZER, "admin"),
    upload.single('image'),
    parseData(),
    userController.updateMyProfile,
  )

  .patch(
    '/block/:id',
    auth('admin'),
    userController.blockedUser,
  )


  .post(
    '/complete',
    auth('user', "organizer", "admin"),
    userController.completedProfile,
  )

  .get(
    '/my-profile',
    auth(
      'user', "organizer", "admin",
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
  .get('/all-users', auth("admin"), userController.getAllUsers)

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
    '/:id',
    auth("user", "admin"),
    userController.getUserById
  )




  .delete(
    '/delete-my-account',
    auth('user'
    ),
    userController.deleteMyAccount,
  );

// export default userRoutes;
