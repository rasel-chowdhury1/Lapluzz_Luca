import { Router } from 'express';
import { checklistController } from './checklist.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const upload = fileUpload('./public/uploads/checkList');

const router = Router();

// Route to create a new checklist
router.post(
  '/create',
  auth(USER_ROLE.USER),
  upload.single('image'),
  parseData(),
  checklistController.createChecklist
);

// Route to create a new checklist
router.patch(
  '/update/:checkListId',
  auth(USER_ROLE.USER),
  upload.single('image'),
  parseData(),
  checklistController.updateChecklist
);

// Route to add an item to a checklist
router.post(
  '/add-item',
  auth(USER_ROLE.USER),
  checklistController.addItemToChecklist
);

// Route to update the `isChecked` status of an item (check/uncheck)
router.patch(
  '/update-item-status',
  auth(USER_ROLE.USER),
  checklistController.updateItemStatus
);

router.patch(
  "/update-item-name",
  auth(USER_ROLE.USER),
  checklistController.updateChecklistItemName
)


router.patch(
  "/delete-item",
  auth(USER_ROLE.USER),
  checklistController.deleteChecklistItem
)
// Route to get all checklists for the user
router.get(
  '/',
  auth(USER_ROLE.USER),
  checklistController.getUserChecklists
);

// Route to get a specific checklist by name
router.get(
  '/:checklistName',
  auth(USER_ROLE.USER),
  checklistController.getChecklistByName
);

// Route to count how many items are checked in a checklist
router.get(
  '/:checklistName/count-checked-items',
  auth(USER_ROLE.USER),
  checklistController.countCheckedItems
);

// Route to soft delete a checklist
router.delete(
  '/:checkListId',
  auth(USER_ROLE.USER),
  checklistController.deleteChecklist
);


// Optional: Route to permanently delete a checklist
router.delete(
  '/:checkListId/permanent',
  auth(USER_ROLE.USER),
  checklistController.hardDeleteChecklist
);

export const checklistRoutes = router;