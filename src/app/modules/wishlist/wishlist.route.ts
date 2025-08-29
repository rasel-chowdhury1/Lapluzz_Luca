import { Router } from 'express';
import { wishListController } from './wishlist.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';
import fileUpload from '../../middleware/fileUpload';
const upload = fileUpload('./public/uploads/wishlist');


const router = Router();

router.post(
  '/add',
  auth(USER_ROLE.USER),
  wishListController.createOrUpdateFolder
)

  .post(
    '/create',
    auth(USER_ROLE.USER),
    upload.single('image'),
    parseData(),
    wishListController.createFolder
  )

.post(
  '/remove-item',
  auth(USER_ROLE.USER,USER_ROLE.ORGANIZER),
  wishListController.removeServiceFromFolder
)

.patch(
  '/update',
  auth(USER_ROLE.USER),
  wishListController.updateFolderIsActive
)

.patch(
  '/update-folder-name', 
  auth(USER_ROLE.USER,USER_ROLE.ORGANIZER),
  wishListController.updateWishlist
)
.patch(
  '/soft-delete-folder', 
  auth(USER_ROLE.USER,USER_ROLE.ORGANIZER),
  wishListController.softDeleteFolder
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
