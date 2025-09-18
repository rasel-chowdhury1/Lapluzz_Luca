import { Router } from 'express';
import { categoryController } from './category.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import parseData from '../../middleware/parseData';
import fileUpload from '../../middleware/fileUpload';
const upload = fileUpload('./public/uploads/categories');

const router = Router();

router.post(
  '/create',
  // auth(USER_ROLE.ADMIN),
  // upload.single('banner'),
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  parseData(),
  categoryController.createCategory,
)

.patch(
  '/update/:id',
  // auth(USER_ROLE.ADMIN),
    upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  parseData(),
  categoryController.updateCategory,
)

.delete(
  '/:id',
  auth(USER_ROLE.ADMIN),
  categoryController.deleteCategory,
)
  .get(
    '/',
    categoryController.getAllCategory
  )
  .get(
    '/business',
    categoryController.getBusinessCategories
  )
  .get(
    '/id/:id',
    categoryController.getCategoryById
  )
  .get(
    '/:categoryName',
    categoryController.getDynamicCategory
  );



export const categoryRoutes = router;