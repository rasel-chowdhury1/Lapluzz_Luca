
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
);
router.get('/', inspirationController.getAllInspirations);
// ✅ New Route: Grouped by category
router.get(
  '/group-by/category',
  inspirationController.getAllInspirationsGroupedByCategory
);

router.get(
    '/category/:categoryId', 
    inspirationController.getSpecificCategoryInspiration
);
router.get('/:id', inspirationController.getInspirationById);
router.put('/:id', inspirationController.updateInspiration);
router.delete('/:id', inspirationController.deleteInspiration);

export const InspirationRoutes = router;