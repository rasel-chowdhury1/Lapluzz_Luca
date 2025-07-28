import { Router } from 'express';
import { jobController } from './job.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';

const upload = fileUpload('./public/uploads/jobs');
const router = Router();

router.post(
  '/create',
  auth(USER_ROLE.ORGANIZER),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),
  parseData(),
  jobController.createJob
  )


  .get(
      '/', 
      jobController.getAllJobs
)
  .get(
    '/my', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    jobController.getMyJobs
)
  .get(
    '/myList', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    jobController.getMyJobsList
)
  
  .get(
    '/latest', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
    jobController.getLatestJobs
)
  .get(
    "/sub",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    jobController.getSubscriptionJobs
)
  .get(
    "/all",
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    jobController.getUnsubscriptionJobs
)
  .get(
    '/stats/:jobId', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    jobController.getSpecificJobStats
  )
  .get(
    '/list', 
    auth( USER_ROLE.ADMIN),
    jobController.getAllJobList
  )
  .get(
    '/:id', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    jobController.getJobById
  )
  .patch(
    '/update/:jobId', 
    auth(USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'gallery', maxCount: 10 }
    ]),
    parseData(),
    jobController.updateJob
  )
  .delete(
      '/:id', 
      jobController.deleteJob);

export const jobRoutes = router;
