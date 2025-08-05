import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
import { mySubscriptionController } from "./mySubscription.controller";
import httpStatus from 'http-status';

const router = Router();

router
.get(
    "/",
    auth(USER_ROLE.ORGANIZER),
    mySubscriptionController.getMySubscriptions
)

.patch(
    "/activate/:id",
    auth(USER_ROLE.ORGANIZER),
    mySubscriptionController.activateSubscription
)

.patch(
    "/stop/:id",
    auth(USER_ROLE.ORGANIZER),
    mySubscriptionController.stopSubscription
)

export const mySubscriptionRoutes = router;