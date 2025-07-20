
import { Router } from 'express';
import { inspirationController } from './inspiration.controller';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
const upload = fileUpload('./public/uploads/inspiration');

const router = Router();

router.post(
  '/create', 
  auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    upload.fields([
      { name: 'cover', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ]),
    parseData(),
    inspirationController.createInspiration
)
  
  .get(
    '/',
    inspirationController.getAllInspirations
  )
  .get(
    '/my',
    auth(USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    inspirationController.getMyInspirations)


  // ✅ New Route: Grouped by category
  .get(
    '/group-by/category',
    inspirationController.getAllInspirationsGroupedByCategory
  )

  .get(
      '/category/:categoryId', 
      inspirationController.getSpecificCategoryInspiration
  )


  .get(
    '/:id',
    inspirationController.getInspirationById
  )

  .put(
    '/:id',
    inspirationController.updateInspiration
)
  
  .delete(
    '/:id',
    inspirationController.deleteInspiration
  )

export const InspirationRoutes = router;