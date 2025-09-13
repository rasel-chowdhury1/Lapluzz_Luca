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
import { Coupon } from '../coupon/coupon.model';
import MySubscription from '../mySubscription/mySubscription.model';
import mongoose from 'mongoose';
import { getAdminData } from '../../DB/adminStore';
import { emitNotificationOfSuccessfullyPamentSubcription } from '../../../socketIo';

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

  const { subscriptionId, subscriptionOptionIndex, subscriptionFor, subscriptionForType, couponCode, type, userTotalCredits } = req.body;
  const { userId } = req.user;

  // 🧾 Validate subscription
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) throw new AppError(404, 'Subscription not found');

  // 🧮 Validate selected option
  const selectedOption = subscription.options[subscriptionOptionIndex];
  if (!selectedOption) throw new AppError(400, 'Invalid subscription option selected');

  console.log("selected option ->>> ", selectedOption)

  let finalAmount = selectedOption.price;

  // 🎟️ Apply Coupon Discount if couponCode exists
  if (couponCode) {
    const now = new Date();
    const coupon = await Coupon.findOne({
      name: couponCode,
      appliesTo: { $in: ['all', subscriptionForType] },
      isEnable: true,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!coupon ) {
      throw new AppError(400, 'Invalid or expired coupon');
    }

    if(coupon.usageLimit <= coupon.usedCount){
      throw new AppError(400 , "coupon limit reached")
    }

        // 💸 Apply percentage discount
    finalAmount = finalAmount - (finalAmount * coupon.discountPrice / 100);

    // Never below 0, round to 2 decimals
    finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);

  }

  let paymentType = "payment";
  let useCredits = 0;
  if(type ==="credit"){
    paymentType = "creditWithPayment";
    finalAmount= finalAmount - userTotalCredits;
    useCredits = userTotalCredits;
  }

  // 📆 Set expiration date
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + (selectedOption.expirationDays || 30));

// Set subscriptionType based on subscriptionForType and subscription.title
    let subscriptionType = '';
    
    if (subscriptionForType === 'Business') {
      if (['none', 'exclusive', 'elite', 'prime', 'custom'].includes(subscription.title.toLowerCase())) {
        console.log("=>>> subscription title =>>> ",subscription.title.toLowerCase())
        subscriptionType = subscription.title.toLowerCase();  // 'exclusive', 'elite', 'prime', or 'custom'
      }
    } else if (subscriptionForType === 'Event') {
      if (['none', 'diamond', 'emerald', 'ruby', 'custom'].includes(subscription.title.toLowerCase())) {
        subscriptionType = subscription.title.toLowerCase();  // 'none', 'diamond', 'emerald', 'ruby', or 'custom'
      }
    } else if (subscriptionForType === 'Job') {
      if (['none', 'visualTop', 'visualMedia', 'visualBase', 'custom'].includes(subscription.title.toLowerCase())) {
        subscriptionType = subscription.title.toLowerCase();  // 'none', 'visualTop', 'visualMedia', 'visualBase', or 'custom'
      }
    } else {
      subscriptionType = 'custom'; // Default to 'custom' for any other subscriptionForType
    }

  // 💳 Create payment record
  const payment = await SubscriptionPayment.create({
    paymentId: `woo-${Date.now()}`, // temp ID for now
    amount: finalAmount,
    userId,
    subscriptionFor,
    subscriptionForType,
    subscription: subscription._id,
    subscriptionOptionIndex,
    subcriptionDays: selectedOption.expirationDays,
    subscriptionPriorityLevel: subscription.priorityLevel,
    subBlueVerifiedBadge: subscription.blueVerified,
    subscriptionType: subscriptionType,
    useCredits,
    paymentType,
    status: 'pending',
    autoRefundAmount: finalAmount,
    activateExpireDays: selectedOption.refoundDays,
    expireDate,
    ...(couponCode && { appliedCoupon: couponCode }), // optionally store applied coupon
  });

  console.log('💰 Payment Created:', payment);

  // 🔗 Redirect URL for WooCommerce (nice and clean)
  const redirectUrl = `https://pianofesta.it/pagamento/checkout?subscription_payment_id=${payment._id}&amount=${payment.amount}`;

  // 🚀 Respond back to client
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Redirect to WooCommerce payment UI',
    data: { redirectUrl },
  });
});

const buySubscriptionByCredits = catchAsync(async (req: Request, res: Response) => {

  console.log("buy subscription body data ->>> ", req.body);

  const { subscriptionId, subscriptionOptionIndex, subscriptionFor, subscriptionForType,couponCode } = req.body;
  const { userId } = req.user;

  const session = await mongoose.startSession(); // Start the transaction session
  session.startTransaction();

  try {
    // 🔍 Get the user and check credits
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const userTotalCredits = user.totalCredits || 0;

    // 🔍 Validate subscription existence
    const subscription = await Subscription.findById(subscriptionId).session(session);
    console.log("Specefic subscription data -==>>>> ", subscription)
    if (!subscription) {
      throw new AppError(404, 'The selected subscription does not exist.');
    }

    // 🔍 Validate subscription option index
    const selectedOption = subscription.options?.[subscriptionOptionIndex];

    console.log("selected option =>>> ", selectedOption)

    if (!selectedOption) {
      console.log("'Invalid subscription option index provided.'")
      throw new AppError(400, 'Invalid subscription option index provided.');
    }

      let finalAmount = selectedOption.price;

    // 🎟️ Apply Coupon Discount if couponCode exists
    if (couponCode) {
      const now = new Date();
      const coupon = await Coupon.findOne({
        name: couponCode,
        appliesTo: { $in: ['all', subscriptionForType] },
        isEnable: true,
        isDeleted: false,
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      if (!coupon ) {
        throw new AppError(400, 'Invalid or expired coupon');
      }

      if(coupon.usageLimit <= coupon.usedCount){
        throw new AppError(400 , "coupon limit reached")
      }

          // 💸 Apply percentage discount
      finalAmount = finalAmount - (finalAmount * coupon.discountPrice / 100);

      // Never below 0, round to 2 decimals
      finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);
    }


    // 💸 Check if user has enough credits
    if (finalAmount > userTotalCredits) {

      
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: 'Insufficient credits to purchase this subscription.',
        data: null,
      });
    }

       // 📆 Calculate activateExpireDate (user must activate within X days after purchase)
    let activateExpireDate = new Date();
    activateExpireDate.setDate(
      activateExpireDate.getDate() + (selectedOption.refoundDays || 60) // default 60 days
    );

    // 📆 Calculate expiration date
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (selectedOption.expirationDays || 30));

    // Set subscriptionType based on subscriptionForType and subscription.title
    let subscriptionType = '';
    
    if (subscriptionForType === 'Business') {
      if (['none', 'exclusive', 'elite', 'prime', 'custom'].includes(subscription.title.toLowerCase())) {
        subscriptionType = subscription.title.toLowerCase();  // 'exclusive', 'elite', 'prime', or 'custom'
      }
    } else if (subscriptionForType === 'Event') {
      if (['none', 'diamond', 'emerald', 'ruby', 'custom'].includes(subscription.title.toLowerCase())) {
        subscriptionType = subscription.title.toLowerCase();  // 'none', 'diamond', 'emerald', 'ruby', or 'custom'
      }
    } else if (subscriptionForType === 'Job') {
      if (['none', 'visualTop', 'visualMedia', 'visualBase', 'custom'].includes(subscription.title.toLowerCase())) {
        subscriptionType = subscription.title.toLowerCase();  // 'none', 'visualTop', 'visualMedia', 'visualBase', or 'custom'
      }
    } else {
      subscriptionType = 'custom'; // Default to 'custom' for any other subscriptionForType
    }

    console.log("subscription type =>>> ", subscriptionType)

    


    // 💳 Create a new subscription payment entry with 'Completed' status
    const payment = await SubscriptionPayment.create([{
      paymentId: `credit-${Date.now()}`,
      amount: selectedOption.price,
      userId,
      subscriptionFor,
      subscriptionForType,
      subscription: subscription._id,
      subscriptionOptionIndex,
      subcriptionDays: selectedOption.expirationDays,
      subscriptionPriorityLevel: subscription.priorityLevel,
      subBlueVerifiedBadge: subscription.blueVerified,
      subscriptionType: subscriptionType,
      paymentType: 'credit',
      status: 'completed',
      autoRefundAmount: finalAmount,
      activateExpireDays: selectedOption.refoundDays,
      expireDate,
    }], { session });

    // ✅ Create MySubscription using updated fields
    await MySubscription.create([{
      user: userId,
      subscriptionPaymentId: payment[0]._id,
      expiryDate: expireDate,
      subscriptionFor: subscriptionFor,
      subscriptionForType: subscriptionForType,
      subscription: subscription,
      subscriptionOptionIndex: subscriptionOptionIndex,
      subcriptionDays: selectedOption.expirationDays,
      subscriptionPriorityLevel: subscription.priorityLevel,
      subBlueVerifiedBadge: subscription.blueVerified,
      subscriptionType,
      paymentType: "credit",
      status: 'notActivate',
      autoRefundAmount: finalAmount,
      activateExpireDays: selectedOption.refoundDays,
      activateExpireDate,
      expireDate: expireDate
    }], { session });

    // 🧾 Update user's credits without using .save()
    await User.findByIdAndUpdate(userId, {
      $inc: { totalCredits: -selectedOption.price },
    }, { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // 📤 Send success response
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Subscription purchased successfully using your credits.',
      data: null,
    });
  } catch (error) {
    console.log("errror --->>>> ",error.message)
    // If an error occurs, abort the transaction and rollback
    await session.abortTransaction();
    session.endSession();
    throw error; // Rethrow the error after rolling back
  }
});

// subscriptionPayment.controller.ts

const handleWooPaymentWebhook = catchAsync(async (req: Request, res: Response) => {
  const {
    subscription_payment_id,
    woo_order_id,
    status,
    payment_status,
    payment_method,
    amount_cents,
    currency,
    payment_detials,
    customer,
  } = req.body;

  console.log("Webhook payload received:", req.body);

  // 🔴 Exit early if payment not successful
  if (status !== 'completed') {
    console.log("Payment status not completed:", status);
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: 'Payment not successful',
      data: null,
    });
  }

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();



  try {
    // ✅ Update SubscriptionPayment
    const updated = await SubscriptionPayment.findByIdAndUpdate(
      subscription_payment_id,
      {
        transaction_id: payment_detials?.transaction_id,
        woo_order_id,
        amount_cents,
        currency,
        customer_name: customer?.name || '',
        customer_email: customer?.email || '',
        payment_method,
        payment_status,
        status,
        userStatus: "notActivate"
      },
      { new: true, session } // Pass the session to the query
    );

    if (!updated) {
      throw new AppError(404, 'Subscription payment record not found');
    }


    if(updated.paymentType === "creditWithPayment") {
      await User.findByIdAndUpdate(
        updated.userId,
        { $inc: { totalCredits: -updated.useCredits } },
        {session}
      )
    }

   // 📆 Calculate activateExpireDate (user must activate within X days after purchase)
    let activateExpireDate = new Date(updated.createdAt ?? new Date());
    activateExpireDate.setDate(
      activateExpireDate.getDate() + (updated.activateExpireDays || 60) // default 60 days
    );

        // 📆 Calculate expiration date
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + (updated.subcriptionDays || 30));



    // ✅ Create MySubscription using updated fields
    await MySubscription.create(
      [{
        user: updated.userId,
        subscriptionPaymentId: subscription_payment_id,
        expiryDate: updated.expireDate,
        subscriptionFor: updated.subscriptionFor,
        subscriptionForType: updated.subscriptionForType,
        subscription: updated.subscription,
        subscriptionOptionIndex: updated.subscriptionOptionIndex,
        subscriptionPriorityLevel: updated.subscriptionPriorityLevel,
        subscriptionType: updated.subscriptionType,
        payment_method: updated.payment_method,
        payment_status: updated.payment_status,
        useCredits: updated.useCredits,
        paymentType: updated.paymentType,
        autoRefundAmount: updated.autoRefundAmount,
        activateExpireDays: updated.activateExpireDays,
        activateExpireDate,
        expireDate: expireDate,
        status: 'notActivate',
      }],
      { session } // Pass the session to the query
    );

    // ✅ Increment coupon usage if applicable
    if (updated.couponCode) {
      await Coupon.findOneAndUpdate(
        { name: updated.couponCode },
        { $inc: { usedCount: 1 } },
        { session } // Pass the session to the query
      );
    }

    // Commit the transaction
    await session.commitTransaction();

     // Fetch admin data (for sending a notification)
    const adminData: any = getAdminData();

    if (!adminData || !adminData._id) {
      console.error("Admin data not found. Cannot send reminder notifications.");
      return; // Stop the notification process if admin data is not available
    }

    // Fetch the user object to personalize the message
    const user = await User.findById(updated.userId);  // Assuming the user exists in the updated document

    if (!user) {
      console.error("User not found for the provided userId.");
      return;
    }

    // Prepare the notification message
    const userMsg = {
      name: `🎉 Congratulations, ${user.name || 'User'}! Your Subscription is Ready to Activate`,
      image: (adminData.profileImage ?? "") as string,
      text: `Hi ${user?.name}, you’ve successfully completed your payment! To start boosting your ${updated.subscriptionForType} with Pianofesta, go to your sponsorship list and activate your subscription now. Let's grow your ${updated.subscriptionForType} together! 🌟`,
    };

    // Send notification to the user (using Socket.IO and save it to the database)
    await emitNotificationOfSuccessfullyPamentSubcription({
      userId: adminData._id as mongoose.Types.ObjectId,
      receiverId: updated.userId as mongoose.Types.ObjectId,
      userMsg,
    });

    // Final response
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Subscription payment processed successfully',
      data: updated,
    });
  } catch (error) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    console.error("Error during payment processing:", error);
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: 'An error occurred while processing the subscription payment',
      data: null,
    });
  } finally {
    // End the session
    session.endSession();
  }
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
