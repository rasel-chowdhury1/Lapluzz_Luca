import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { User } from '../user/user.models';
import SubscriptionPayment from './subscriptionPayment.model';
import Business from '../business/business.model';
import { differenceInDays } from 'date-fns'; // install with: npm i date-fns
import MySubscription from '../mySubscription/mySubscription.model';

const findPaymentData = async (paymentDataBody: any) => {
  const paymentData = await SubscriptionPayment.findOne({
    user: paymentDataBody.userId,
    paymentId: paymentDataBody.paymentId,
  });

  return paymentData;
};

const addPaymentData = async (paymentDataBody: any) => {
  var paymentData = await findPaymentData(paymentDataBody);
  if (paymentData) {
    throw new AppError(
      httpStatus.CONFLICT,
      'this payment-information already exists...',
    );
  }

  return 'payment data checking...';
  // paymentData = new PaymentData(paymentDataBody);
  // await paymentData.save();
  // return paymentData;
};

// const createPayment = async (res: any, payload: any) => {
//   const result = await createCheckoutSession(res, payload);
//   return result;
// };

// const confirmPayment = async (data: any) => {
//   console.log('==== confirm payment data ===>>>>>n ', data);
//   const { userId, subcriptionId,subscriptionFor,subscriptionForType, amount, duration, paymentIntentId } = data;

//   if (!paymentIntentId) {
//     // return res.status(400).json({ success: false, message: "Missing sessionId" });
//     throw new AppError(httpStatus.BAD_REQUEST, 'Missing sessionId');
//   }

//   // Fetch session details from Stripe
//   const session = await stripe.checkout.sessions.retrieve(
//     paymentIntentId as string,
//   );

//   if (!session.payment_intent) {
//     // return res.status(400).json({ success: false, message: "Payment Intent not found" });
//     throw new AppError(httpStatus.BAD_REQUEST, 'Payment Intent not found');
//   }

//   const paymentDataBody = {
//     paymentId: session.payment_intent,
//     amount: Number(amount),
//     subscription: subcriptionId,
//     user: userId,
//     paymentType: 'Card',
//   };

//   const isExistPaymentId = await SubscriptionPayment.findOne({
//     paymentId: session.payment_intent,
//   });

//   if (isExistPaymentId) {
//     // return res.status(400).json({ success: false, message: "Payment Intent not found" });
//     throw new AppError(httpStatus.BAD_REQUEST, 'Payment id already use');
//   }

//   console.log('==== payment data body ===>>>> ', paymentDataBody);

//   let paymentData;

//   try {
//     paymentData = new SubscriptionPayment(paymentDataBody);
//     await paymentData.save();

//     const today = new Date();

//     const expiryDate = new Date(today);
//     expiryDate.setDate(today.getDate() + Number(duration));

//     const updateUser = await User.findByIdAndUpdate(
//       userId,
//       { isSubcription: true },
//       { new: true },
//     );



//     if (!updateUser) {
//       throw new AppError(httpStatus.BAD_REQUEST, 'User not exist');
//     }

//     if (subscriptionFor === "business") {
//       const updateBusiness = await Business.findByIdAndUpdate(subscriptionFor, {
//         isSubscription: true,
//         subscriptionType: subscriptionForType === "EXCLUSIVE" ? "exclusive" : subscriptionForType === "ELITE" ? "elite" : subscriptionForType === "PRIME" ? "prime" : "none",
//         expireSubscriptionTime: expiryDate,
//         $push: subcriptionList.$push
//       } )
//     }

//     const existingSubscription =
//       (await MySubscription.findOne({ user: userId })) ?? false;

//     if (existingSubscription) {
//       existingSubscription.subscription = subcriptionId;
//       existingSubscription.expiryDate = expiryDate;

//       await existingSubscription.save();
//     } else {
//       const newSubscription = new MySubscription({
//         user: userId,
//         subscription: subcriptionId,
//         expiryDate,
//       });

//       await newSubscription.save();
//     }
//   } catch (error) {
//     console.error('Error in confirmPayment:', error);
//     throw new Error('Failed to process the payment and subscription.');
//   }

//   return paymentData;
// };


const buySubscription = async (data: any) => {
  console.log('==== confirm payment data ===>>>>>n ', data);
  const { userId,paymentId, subcriptionId,subscriptionFor,subscriptionForType,optionIndex, amount, duration, paymentType } = data;

  if (!paymentId) {
    // return res.status(400).json({ success: false, message: "Missing sessionId" });
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing paymentId');
  }

  const today = new Date();

  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + Number(duration));

  const paymentDataBody = {
    paymentId,
    amount: Number(amount),
    userId,
    subscriptionFor,
    subscriptionForType,
    subscription: subcriptionId,
    subscriptionOptionIndex: optionIndex,
    paymentType: paymentType,
    // expiryDate:
  }

  const isExistPaymentId = await SubscriptionPayment.findOne({
    paymentId,
  });

  if (isExistPaymentId) {
    // return res.status(400).json({ success: false, message: "Payment Intent not found" });
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment id already use');
  }

  console.log('==== payment data body ===>>>> ', paymentDataBody);

  let paymentData;

  try {
    paymentData = new SubscriptionPayment(paymentDataBody);
    await paymentData.save();



    const updateUser = await User.findByIdAndUpdate(
      userId,
      { isSubcription: true },
      { new: true },
    );



    if (!updateUser) {
      throw new AppError(httpStatus.BAD_REQUEST, 'User not exist');
    }

    if (subscriptionFor === "business") {
      const updateBusiness = await Business.findByIdAndUpdate(subscriptionFor, {
        isSubscription: true,
        subscriptionType: subscriptionForType === "EXCLUSIVE" ? "exclusive" : subscriptionForType === "ELITE" ? "elite" : subscriptionForType === "PRIME" ? "prime" : "none",
        expireSubscriptionTime: expiryDate
      } )
    }

    const existingSubscription =
      (await MySubscription.findOne({ user: userId })) ?? false;

    if (existingSubscription) {
      existingSubscription.subscription = subcriptionId;
      existingSubscription.expiryDate = expiryDate;

      await existingSubscription.save();
    } else {
      const newSubscription = new MySubscription({
        user: userId,
        subscription: subcriptionId,
        expiryDate,
      });

      await newSubscription.save();
    }
  } catch (error) {
    console.error('Error in confirmPayment:', error);
    throw new Error('Failed to process the payment and subscription.');
  }

  return paymentData;
};



const mySubscription = async (userId: string) => {
  const result = await SubscriptionPayment.find({ userId })
    .populate('subscription') // Static reference
    .populate('subscriptionFor', "name title"); // Uses dynamic refPath

  return result || [];
};


const getEarningList = async () => {
  const payments = await SubscriptionPayment.find()
    .sort({ createdAt: -1 }) // Optional: newest first
    .populate('userId', 'name email profileImage customId') // select only needed fields
    .populate('subscription', 'title') // get plan name
    .lean();

  const result = payments.map((payment) => {
    const user = payment.userId as any;
    const subscription = payment.subscription as any;

    const expireDate = new Date(payment.expireDate);
    const today = new Date();
    const remainingday = Math.max(differenceInDays(expireDate, today), 0); // ensure non-negative

    return {
      name: user?.name || 'Unknown',
      sureName: user?.sureName || 'Unknown',
      email: user?.email || 'Unknown',
      profileImage: user?.profileImage || '',
      customId: user?.customId || '',
      purchaseDate: payment.createdAt,
      endDate: payment.expireDate,
      remainingday,
      plan: subscription?.title || 'Unknown',
      amount: payment.amount,
      status: payment.status,
      userStatus: payment.userStatus,
      woo_order_id: payment.woo_order_id || '',
      paymentMethod: payment.payment_method,
      createAt: payment.createdAt
    };
  });

  return result;
};


export const SubcriptionPaymentService = {
  addPaymentData,
  
  //=== stripe start === 
  // createPayment,
  // confirmPayment,
  buySubscription,
  mySubscription,
  getEarningList
  //=== stripe end === 
};
