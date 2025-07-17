import express from 'express';
import { JobApplicantController } from './jobApplicant.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const upload = fileUpload('./public/uploads/job');
const router = express.Router();

router
    .post(
    '/',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    upload.single('viewCvImage'),
    parseData(),
    JobApplicantController.createJobApplicant
    )

    .get(
        '/job/:jobId',
        JobApplicantController.getApplicantsByJob
    )
    
    .get(
        '/:jobId/user/:userId',
        JobApplicantController.getApplicant
    );

export const JobApplicantRoutes = router;
