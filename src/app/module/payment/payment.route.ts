import express, { Router } from "express";
import { paymentController } from "./payment.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentValidation } from "./payment.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  STRIPE WEBHOOK (Automatic)
//  ⚠️ MUST be defined BEFORE express.json() in your main app file
//  Verify signature and auto-generate meeting links
// ─────────────────────────────────────────────────────────────

router.post(
  "/webhook/stripe",
  paymentController.stripeWebhook
);

// ─────────────────────────────────────────────────────────────
//  STRIPE INITIATE (Student Only)
// ─────────────────────────────────────────────────────────────

/**
 * POST /payments/initiate
 * স্টুডেন্ট কার্ড পেমেন্ট শুরু করার জন্য এটি ব্যবহার করবে
 */
router.post(
  "/initiate",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.initiatePaymentSchema),
  paymentController.initiatePayment
);

// ─────────────────────────────────────────────────────────────
//  MANUAL PAYMENT - bKash/Nagad (Student & Admin)
// ─────────────────────────────────────────────────────────────

/**
 * POST /payments/submit-manual
 * স্টুডেন্ট ম্যানুয়ালি টাকা পাঠানোর পর TxID সাবমিট করবে
 */
router.post(
  "/submit-manual",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.manualPaymentSchema), // Zod Schema থাকতে হবে
  paymentController.submitManualPayment
);

/**
 * PATCH /payments/approve/:bookingId
 * অ্যাডমিন TxID ভেরিফাই করে পেমেন্ট অ্যাপ্রুভ করবে এবং লিঙ্ক জেনারেট হবে
 */
router.patch(
  "/approve/:bookingId",
  checkAuth(UserRole.ADMIN, UserRole.TUTOR),
  paymentController.approveManualPayment
);


// ─────────────────────────────────────────────────────────────
//  PAYMENT DETAILS & REFUND
// ─────────────────────────────────────────────────────────────

router.get(
  "/history",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN), 
  paymentController.getPaymentHistory
);

/**
 * GET /payments/booking/:bookingId
 * স্টুডেন্ট, টিউটর বা অ্যাডমিন পেমেন্ট ডিটেইলস দেখতে পারবে
 */
// router.get(
//   "/booking/:bookingId",
//   checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
//   paymentController.getPaymentByBooking
// );

/**
 * POST /payments/booking/:bookingId/refund
 * অ্যাডমিন পেমেন্ট রিফান্ড করতে পারবে
 */
// router.post(
//   "/booking/:bookingId/refund",
//   checkAuth(UserRole.ADMIN),
//   paymentController.refundPayment
// );

export const PaymentRoutes = router;