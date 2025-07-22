import { Router } from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import { SubcriptionPaymentController } from './subscriptionPayment.controller';

const router = Router();


// router.post(
//   '/paypal/webhook',
//   auth(USER_ROLE.GUIDE),
//   SubcriptionPaymentController.createPaymentSubscriptionByPaypal,
// );

// router.get(
//   '/confirm-payment', 
//   SubcriptionPaymentController.confirmPaymentByPaypal
// );

// router.post(
//   '/confirm-payment',
//   auth(USER_ROLE.GUIDE),
//   SubcriptionPaymentController.confirmPaymentSubcription
// )

// == stripe implement for payment route --- start

router.post(
  '/webhook',
  auth(USER_ROLE.ORGANIZER),
  SubcriptionPaymentController.createPaymentSubscription,
);

router.get(
  '/confirm-payment', 
  SubcriptionPaymentController.confirmPayment
);

router.get(
  "/buy",
  auth(USER_ROLE.ORGANIZER),
  SubcriptionPaymentController.buySubscription
)

// routes/subscriptionPayment.routes.ts
router.post(
  '/initiate',
  auth(USER_ROLE.ORGANIZER),
  SubcriptionPaymentController.initiateSubscriptionPayment
);
router.post('/woo-webhook', SubcriptionPaymentController.handleWooPaymentWebhook);
// == stripe implement for payment route --- end 

export const subcriptionPaymentRoutes = router;
