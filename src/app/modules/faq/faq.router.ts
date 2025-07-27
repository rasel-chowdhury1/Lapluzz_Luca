import express from 'express';
import { faqController } from './faq.controller';

const router = express.Router();

router.get(
    '/',
    faqController.getFaqs
)         // Get FAQs
    .post(
        '/create',
        faqController.createFaqs
    )      // Create new FAQs
    .patch(
        '/:id',
        faqController.updateFaqs
    );  // Update existing FAQs by ID

export const faqRoutes =  router;
