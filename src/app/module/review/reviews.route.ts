import { Router } from "express";


const router = Router();
import { reviewControllers } from "./reviews.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { bookingQuerySchema, createReviewSchema } from "../booking/booking.validation";
import { UserRole } from "../../../generated/prisma/enums";
router.post(
  "/",
  checkAuth(UserRole.STUDENT),
  validateRequest(createReviewSchema),
  reviewControllers.createReview
);


/**
 * GET /bookings/reviews/:tutorId
 * Public — anyone can view a tutor's reviews
 * Query: ?page=1  &limit=10
 */

router.get(
  "/me",
  checkAuth(UserRole.STUDENT),
    validateRequest(bookingQuerySchema),
  reviewControllers.getMyReviews
);

router.get(
  "/",
  validateRequest(bookingQuerySchema),
  reviewControllers.getAllReviews
);

export const reviewRoutes = router;
