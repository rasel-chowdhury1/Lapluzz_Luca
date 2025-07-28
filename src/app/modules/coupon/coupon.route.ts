import { Router } from "express";
import { couponController } from "./coupon.controller";

const router = Router();

router
    .post(
        '/create',
        couponController.createCoupon
    )
    .get(
        '/',
        couponController.getAllCoupons
    )
    .get(
        '/:id',
        couponController.getCouponById
)
    
    .patch(
        '/update/:id',
        couponController.updateCoupon
    )
    .patch(
        '/toggle-status/:id',
        couponController.toggleCouponEnable
)
    
    .delete(
        '/:id',
        couponController.deleteCoupon
    );

export const couponRoutes =  router;