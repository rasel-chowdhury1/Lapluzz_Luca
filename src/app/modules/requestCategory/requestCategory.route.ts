import express from 'express';
import { requestCategoryController } from './requestCategory.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';


const router = express.Router();

// 🆕 Create a new requested category
router.post(
    '/create', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    requestCategoryController.createRequestedCategory
)

// 📥 Get all (non-deleted) requested categories
.get(
    '/',
    requestCategoryController.getAllRequestedCategories
)

// 📥 Get one requested category by ID
.get(
    '/:id', 
    requestCategoryController.getRequestedCategoryById
)

// ❌ Soft delete a requested category
.delete(
    '/:id', 
    requestCategoryController.deleteRequestedCategory
);

export const requestCategoryRoutes =  router;
