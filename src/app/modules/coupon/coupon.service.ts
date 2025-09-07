import { emitNotificationAllBusinessUsersFromCouponOffer } from "../../../socketIo";
import { getAdminData } from "../../DB/adminStore";
import { ICoupon, ICouponDocument } from "./coupon.interface";
import { Coupon } from "./coupon.model";


const createCoupon = async (payload: ICoupon): Promise<ICouponDocument> => {
  // Get admin data (you can modify this to fetch admin data from context if needed)
  const adminData = getAdminData();

  console.log("admin data =>>>> ",{adminData})

  // Define the user message for the coupon notification, including the coupon code (payload.name)
  const userMsg = {
    text: `A new coupon offer with code ${payload.name} is available! Claim your discount now and boost your sales. Don't miss out on this opportunity to save and grow!`,
    name: "Coupon Offer",
  };

  console.log({userMsg})
  // 1. Create the coupon without waiting for the notification process
  const newCoupon = await Coupon.create(payload);

  // 2. Fire off the notification asynchronously (don't wait for it)
await  emitNotificationAllBusinessUsersFromCouponOffer({
    userId: adminData?._id as string, // Pass the admin's ID or other identifying data
    userMsg,
    type: 'CouponOfferNotification',
  }).catch((error) => {
    // Handle any error that occurs during notification sending (optional)
    console.error('Error sending notification:', error);
  });

  // 3. Return the newly created coupon document
  return newCoupon;
};


const getAllCoupons = async (): Promise<ICouponDocument[]> => {
  return await Coupon.find({isDeleted: false});
};

const getCouponById = async (id: string): Promise<ICouponDocument | null> => {
  return await Coupon.findById(id);
};

const updateCoupon = async (
  id: string,
  updateData: Partial<ICoupon>
): Promise<ICouponDocument | null> => {
  return await Coupon.findByIdAndUpdate(id, updateData, { new: true });
};

const toggleCouponEnable = async (
  id: string,
): Promise<ICouponDocument | null> => {
  // First, find the existing coupon
  const coupon = await Coupon.findById(id);
  if (!coupon) return null;

  // Toggle the isEnable value
  const updatedCoupon = await Coupon.findByIdAndUpdate(
    id,
    { isEnable: !coupon.isEnable },
    { new: true }
  );

  return updatedCoupon;
};

const deleteCoupon = async (id: string): Promise<ICouponDocument | null> => {
  return await Coupon.findByIdAndUpdate(id, {isDeleted: true}, {new: true});
};

export const couponService = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponEnable,
  deleteCoupon
}