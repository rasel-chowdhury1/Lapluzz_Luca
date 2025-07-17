import { Router } from 'express';
import { wishListController } from './wishlist.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER),
  wishListController.createOrUpdateFolder
);

router.get(
  '/',
  auth(USER_ROLE.USER),
  wishListController.getWishlist
);

router.get(
  '/checklist',
  auth(USER_ROLE.USER),
  wishListController.getWishlistWithTotals
);

export const wishListRoutes = router;
