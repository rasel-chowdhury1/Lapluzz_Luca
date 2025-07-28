import { ICoupon, ICouponDocument } from "./coupon.interface";
import { Coupon } from "./coupon.model";


const createCoupon = async (payload: ICoupon): Promise<ICouponDocument> => {
  return await Coupon.create(payload);
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