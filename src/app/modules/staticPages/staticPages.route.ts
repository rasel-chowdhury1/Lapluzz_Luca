import express from 'express';
import { getPrivacyPolicy } from './staticPage.controller';

const router = express.Router();

router
  .get('/privacy-policy', getPrivacyPolicy)

export const staticPageRoutes =  router;