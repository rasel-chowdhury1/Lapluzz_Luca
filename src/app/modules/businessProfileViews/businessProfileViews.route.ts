import { Router } from 'express';
import { businessProfileViewsController } from './businessProfileViews.controller';

const router = Router();

router.post('/view', businessProfileViewsController.addView);
router.get('/:businessId', businessProfileViewsController.getViewsByBusiness);

export const BusinessProfileViewsRoutes = router;
