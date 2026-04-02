import { Router } from "express";
import { bookingControllers } from "./booking.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import {
  bookingQuerySchema,
  createBookingSchema,
  createReviewSchema,
  updateBookingSchema,
} from "./booking.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  BOOKING ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /bookings
 * Student creates a new booking request
 */
router.post(
  "/",
  checkAuth(UserRole.STUDENT),
  validateRequest(createBookingSchema),
  bookingControllers.createBooking
);

/**
 * GET /bookings/student/me
 * Student views their own bookings
 * Query: ?status=PENDING|ACCEPTED|...  &page=1  &limit=10
 */
router.get(
  "/student",
  checkAuth(UserRole.STUDENT),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsStudent
);

/**
 * GET /bookings/tutor/me
 * Tutor views all their incoming bookings
 * Query: ?status=PENDING|ACCEPTED|...  &page=1  &limit=10
 */
router.get(
  "/tutor",
  checkAuth(UserRole.TUTOR),
  validateRequest(bookingQuerySchema),
  bookingControllers.getMyBookingsAsTutor
);

router.get(
  "/",
   checkAuth(UserRole.ADMIN),
    validateRequest(bookingQuerySchema),
bookingControllers.getAllBookings
);

/**
 * GET /bookings/:id
 * Get a single booking — accessible by the student, tutor, or admin
 */
router.get(
  "/:id",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  bookingControllers.getBookingById
);

/**
 * PATCH /bookings/:id
 * Update booking status or add meeting link
 *
 * TUTOR  → PENDING  : ACCEPTED | REJECTED
 * TUTOR  → ACCEPTED : COMPLETED  (after session ends)
 * STUDENT→ PENDING  : CANCELLED
 * ADMIN  → anything
 */
router.patch(
  "/:id",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  validateRequest(updateBookingSchema),
  bookingControllers.updateBooking
);

// ─────────────────────────────────────────────────────────────
//  REVIEW ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /bookings/reviews
 * Student submits a review — only after session is COMPLETED
 * Body: { bookingId, rating, comment }
 * Note: tutorId is derived from the booking — no need to send it
 */
router.post(
  "/reviews",
  checkAuth(UserRole.STUDENT),
  validateRequest(createReviewSchema),
  bookingControllers.createReview
);

/**
 * GET /bookings/reviews/:tutorId
 * Public — anyone can view a tutor's reviews
 * Query: ?page=1  &limit=10
 */
router.get(
  "/reviews/:tutorId",
  bookingControllers.getReviewsByTutor
);

export const BookingRoute = router;