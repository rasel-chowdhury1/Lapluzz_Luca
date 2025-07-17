import express from 'express';
import { faqController } from './faq.controller';

const router = express.Router();

router.put(
    '/', 
    faqController.upsertFaqList
    ); // upsert whole list

router.get(
    '/', 
    faqController.getFaqList
    );

export const faqRoutes = router;
