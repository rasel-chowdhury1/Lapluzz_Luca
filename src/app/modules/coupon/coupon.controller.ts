import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { couponService } from './coupon.service';
import sendResponse from '../../utils/sendResponse';

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

const getAllCoupons = catchAsync(async (_req: Request, res: Response) => {
  const coupons = await couponService.getAllCoupons();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupons retrieved successfully',
    data: coupons,
  });
});

const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.getCouponById(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon retrieved successfully',
    data: coupon,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});

const toggleCouponEnable = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.toggleCouponEnable(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon enable updated successfully',
    data: coupon,
  });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  await couponService.deleteCoupon(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
      message: 'Coupon deleted successfully',
    data: null
  });
});

export const couponController = {
    createCoupon,
    getAllCoupons,
    getCouponById,
  updateCoupon,
    toggleCouponEnable,
    deleteCoupon
}
