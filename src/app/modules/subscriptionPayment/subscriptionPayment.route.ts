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
)
// routes/subscriptionPayment.routes.ts
.post(
  '/initiate',
  auth(USER_ROLE.ORGANIZER),
  SubcriptionPaymentController.initiateSubscriptionPayment
)
  .post(
    '/woo-webhook',
    SubcriptionPaymentController.handleWooPaymentWebhook
)
  
.get(
  '/confirm-payment', 
  SubcriptionPaymentController.confirmPayment
)

.get(
  "/my",
  auth(USER_ROLE.ORGANIZER),
    SubcriptionPaymentController.getMySubscription
  )

.get(
  "/earning",
   auth(USER_ROLE.ADMIN),
    SubcriptionPaymentController.getEarningList
  )

router.get(
  "/buy",
  auth(USER_ROLE.ORGANIZER),
  SubcriptionPaymentController.buySubscription
)




  
// == stripe implement for payment route --- end 

export const subcriptionPaymentRoutes = router;
