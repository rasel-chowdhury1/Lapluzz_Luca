import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import Subcription from '../subscription/subcription.model';
import { SubcriptionPaymentService } from './subscriptionPayment.service';
import Subscription from '../subscription/subcription.model';
import AppError from '../../error/AppError';
import SubscriptionPayment from './subscriptionPayment.model';
import { User } from '../user/user.models';

const paymentTypeMap: Record<string, string> = {
  'card': 'Card',
  'klarna': 'Klarna',
  'paypal': 'Paypal',
  'bank_transfer': 'Bank',
  "manual": "Manual"
};

// import AppError from '../../error/AppError';
// import { PaypalUtils } from '../../utils/paypal';



// // paypal implement for payment === >>>>>> start -----

// const createPaymentSubscriptionByPaypal = catchAsync( 
//   async (req: Request, res: Response) => {
//     // console.log('==== req user === >>>>> ', req.user);
//     const { userId } = req.user;

//     req.body._id = userId;

//     const { _id, subcriptionId } = req.body;

//     if (!_id || !subcriptionId) {
//       throw new Error(
//         'Invalid request body. userId and subcriptionId are required.',
//       );
//     }

//     // Check if subsciption exists
//     const isExist = await Subcription.findById(subcriptionId);

//     if (!isExist) {
//       throw new Error(`Subscription with ID ${subcriptionId} does not exist.`);
//     }

//     req.body.subcriptionName = isExist.name;
//     req.body.amount = isExist.price;
//     req.body.duration = isExist.duration;

//     const {amount, duration} = req.body;


//     console.log("+++++ req body data = >>> ", req.body);

    

//     // Check if required fields are present
//     if (!_id || !subcriptionId || !amount || !duration) {
//       return sendResponse(res, {
//         statusCode: 400,
//         success: false,
//         message: 'Missing required userId subcriptionId amount and duration of payment details.',
//         data: null,
//       });
//     }

    
//     const paymentResult = await SubcriptionPaymentService.createPaymentByPaypal(req.body);
//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: 'Successfully Paypal payment instant',
//         data:paymentResult,
//       });

//   },
// );

// const confirmPaymentByPaypal = catchAsync(async (req: Request, res: Response) => {
//   console.log('====== before confirm payment ====>>> ', req.query);
  
//   const { paymentId, userId, subcriptionId, amount, duration, token, PayerID } = req.query;

//   const data = {
//     paymentIntentId: paymentId,
//     userId,
//     subcriptionId,
//     amount,
//     duration,
//     token,
//     PayerID
//   };

//   const paymentResult = await SubcriptionPaymentService.confirmPaymentByPaypal(data) || "";

//   if (paymentResult) {
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'thank you for payment',
//       data: paymentResult,
//     });
//   }
// });
// // paypal implement for payment === >>>>>> end -----

// const confirmPaymentSubcription = catchAsync(async (req: Request, res: Response) => {
//   console.log('====== before confirm payment ====>>> ', req.body);

//   const {userId} = req.user;
//   const { paymentId,subcriptionId, paymentType } = req.body;

//   const isSubcription = await Subcription.findById(subcriptionId) as any;

//   console.log({isSubcription})
  
//   if(!isSubcription){
//     sendResponse(res, {
//       statusCode: httpStatus.NOT_FOUND,
//       success: false,
//       message: 'Subcription is not found',
//       data: "",
//     });
//   }

//   const data = {
//     paymentIntentId: paymentId,
//     userId,
//     subcriptionId,
//     amount: isSubcription.price,
//     duration: isSubcription.duration,
//     paymentMethod: paymentType
//   };

//   const paymentResult = await SubcriptionPaymentService.confirmPaymentSubcription(data) || "";

//   console.log({paymentResult})

//   if (paymentResult) {
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'thank you for subcrption',
//       data: paymentResult,
//     });
//   }
// });




// stripe implement for payment === >>>>>> start -----

const createPaymentSubscription = catchAsync(
  async (req: Request, res: Response) => {
    console.log('==== req user === >>>>> ', req.user);
    const { userId } = req.user;

    req.body._id = userId;

    const { _id,subscriptionFor, subcriptionId, amount, optionIndex } = req.body;
    console.log('==== req body data =====>>>>>> ', {
      _id,
      subcriptionId,
      amount,
    });

    if (!_id || !subscriptionFor || !subcriptionId) {
      console.log('=== this is if conditaions is exist ====>>>> ');
      throw new Error(
        'Invalid request body. userId and subcriptionId are required.',
      );
    }

    // Check if subsciption exists
    const isExist = await Subcription.findById(subcriptionId);

    if (!isExist) {
      throw new Error(`Subscription with ID ${subcriptionId} does not exist.`);
    }
    
    req.body.subscriptionFor = subscriptionFor;
    req.body.subscriptionForType = isExist.type;
    req.body.subcriptionTitle = isExist.title;
    req.body.amount = isExist.options[optionIndex].price;
    req.body.duration = isExist.options[optionIndex].expirationDays;
    console.log('=== is exist subcription ===>>>> ', isExist);
    req.body.subsciptionData = isExist;

    const paymentResult = await SubcriptionPaymentService.createPayment(
      res,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'payment successfull',
      data: paymentResult,
    });
  },
);

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  console.log('====== before confirm payment ====>>> ', req.query);
  
  const { paymentId, userId, subcriptionId, amount, duration } = req.query;

  const data = {
    paymentIntentId: paymentId,
    userId,
    subcriptionId,
    amount,
    duration,
  };

  const paymentResult = await SubcriptionPaymentService.confirmPayment(data);

  if (paymentResult) {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'thank you for payment',
      data: paymentResult,
    });
  }
});
// stripe implement for payment === >>>>>> end -----



const buySubscription = catchAsync(async (req: Request, res: Response) => {
  
  req.body.userId = req.user.userId;
  const paymentResult = await SubcriptionPaymentService.buySubscription(req.body);

  if (paymentResult) {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'thank you for payment',
      data: paymentResult,
    });
  }
});


const initiateSubscriptionPayment = catchAsync(async (req: Request, res: Response) => {

  const { subscriptionId, subscriptionOptionIndex, subscriptionFor, subscriptionForType } = req.body;

  const { userId } = req.user;

  // 🔍 Validate subscription existence
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) throw new AppError(404, 'Subscription not found');

  // 🔍 Validate subscription option index
  const selectedOption = subscription.options[subscriptionOptionIndex];
  if (!selectedOption) throw new AppError(400, 'Invalid subscription option selected');

  // 📆 Calculate expire date
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + (selectedOption.expirationDays || 30));

  // 💳 Create temporary subscription payment entry
  const payment = await SubscriptionPayment.create({
    paymentId: `woo-${Date.now()}`, // temporary ID
    amount: selectedOption.price,
    userId,
    subscriptionFor,
    subscriptionForType,
    subscription: subscription._id,
    subscriptionOptionIndex,
    paymentType: 'Card', // default; will be updated via webhook
    status: 'pending', // initial status
    expireDate,
  });

  console.log({payment})

  // 🌐 Build WooCommerce redirect URL
  const redirectUrl = `https://pianofesta.it/pagamento/checkout?subscription_payment_id=${payment._id}&amount=${payment.amount}`;

  // 📤 Send response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Redirect to WooCommerce payment UI',
    data: { redirectUrl },
  });
});

const buySubscriptionByCredits = catchAsync(async (req: Request, res: Response) => {
  const { subscriptionId, subscriptionOptionIndex, subscriptionFor, subscriptionForType } = req.body;
  const { userId } = req.user;

  // 🔍 Get the user and check credits
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const userTotalCredits = user.totalCredits || 0;

  // 🔍 Validate subscription existence
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) {
    throw new AppError(404, 'The selected subscription does not exist.');
  }

  // 🔍 Validate subscription option index
  const selectedOption = subscription.options?.[subscriptionOptionIndex];
  if (!selectedOption) {
    throw new AppError(400, 'Invalid subscription option index provided.');
  }

  // 💸 Check if user has enough credits
  if (selectedOption.price > userTotalCredits) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Insufficient credits to purchase this subscription.',
      data: null,
    });
  }

  // 📆 Calculate expiration date
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + (selectedOption.expirationDays || 30));

  // 💳 Create a new subscription payment entry with 'Completed' status
  const payment = await SubscriptionPayment.create({
    paymentId: `credit-${Date.now()}`,
    amount: selectedOption.price,
    userId,
    subscriptionFor,
    subscriptionForType,
    subscription: subscription._id,
    subscriptionOptionIndex,
    paymentType: 'Credit',
    status: 'Completed',
    expireDate,
  });

   // 🧾 Update user's credits without using .save()
  await User.findByIdAndUpdate(userId, {
    $inc: { totalCredits: -selectedOption.price },
  });

  // 📤 Send success response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription purchased successfully using your credits.',
    data: null,
  });
});


// subscriptionPayment.controller.ts

const handleWooPaymentWebhook = catchAsync(async (req: Request, res: Response) => {
  
  const { subscription_payment_id, status,payment_method, woo_order_id,billing_email,billing_first_name,billing_last_name } = req.body;
  
  console.log("req.body handle woo payment -->>> ", req.body);
  console.log(" out status -->>", status)
  // 🔴 Handle failed or incomplete payment
  if (status !== 'Completato') {

    console.log(" in status -->>", status)
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Payment not successful',
      data: null,
    });
  }

  const paymentType = paymentTypeMap[payment_method] || 'Card'; // fallback

  let updated;
  // ✅ Update subscription status
  try {
    updated = await SubscriptionPayment.findByIdAndUpdate(
    subscription_payment_id,
    {
      status,
      woo_order_id, // replace temporary paymentId
      payment_method: paymentType,
      billing_email,
      billing_first_name,
      billing_last_name
    },
    { new: true }
  );
  } catch (error) {
    console.log(error)
  }

  
  if (!updated) {
    throw new AppError(404, 'Subscription payment record not found');
  }

  // ✅ Send success response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription payment successfully',
    data: updated,
  });
});

const getMySubscription = catchAsync(async (req: Request, res: Response) => {


  const { userId } = req.user;

  const result = await SubcriptionPaymentService.mySubscription(userId)
  // ✅ Send success response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My subscription fetched successfully',
    data: result,
  });
});

const getEarningList = catchAsync(async (req: Request, res: Response) => {


  const result = await SubcriptionPaymentService.getEarningList();
  // ✅ Send success response
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Earnlist fetched successfully',
    data: result,
  });
});





export const SubcriptionPaymentController = {
  // createPaymentSubscriptionByPaypal,
  // confirmPaymentByPaypal,
  // confirmPaymentSubcription

   // stripe implement for payment start
   createPaymentSubscription,
  confirmPayment,
  buySubscription,
  initiateSubscriptionPayment,
  handleWooPaymentWebhook,
  getMySubscription,
  getEarningList,
   buySubscriptionByCredits
   // stripe implement for payment end 
  
};
