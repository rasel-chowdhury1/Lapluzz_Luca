import { Router } from 'express';
import { wishListController } from './wishlist.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER),
  wishListController.createOrUpdateFolder
)

.patch(
  '/update',
  auth(USER_ROLE.USER),
  wishListController.updateFolderIsActive
)

.get(
  '/',
  auth(USER_ROLE.USER),
  wishListController.getWishlist
)

.get(
  '/checklist',
  auth(USER_ROLE.USER),
  wishListController.getWishlistWithTotals
)

.get(
  '/:folderName',
  auth(USER_ROLE.USER),
  wishListController.getWishlistFolderDetailsByName
)

export const wishListRoutes = router;
