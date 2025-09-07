import express from 'express';
import { USER_ROLE } from '../user/user.constants';
import { useCreditsController } from './useCredits.controller';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const router = express.Router();
const upload = fileUpload('./public/uploads/profile');
router
     .post(
        "/use",
        auth(USER_ROLE.USER),
        upload.single('image'),
        parseData(),
        useCreditsController.createUseCredits
     )
    

export const useCreditsRoutes = router;