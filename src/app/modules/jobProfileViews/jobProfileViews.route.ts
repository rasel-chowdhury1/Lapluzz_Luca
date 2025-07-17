import { Router } from 'express';
import { jobProfileViewsController } from './jobProfileViews.controller';

const router = Router();

router.post('/view', jobProfileViewsController.addView);
router.get('/:jobId', jobProfileViewsController.getViewsByJob);

export const JobProfileViewsRoutes = router;
