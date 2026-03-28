import express, { Router } from "express";
import { paymentController } from "./payment.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PaymentValidation } from "./payment.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  STRIPE WEBHOOK
//  ⚠️  MUST be defined BEFORE express.json() is applied.
//  Stripe requires the raw Buffer body to verify the signature.
//  We apply express.raw() ONLY to this specific route.
// ─────────────────────────────────────────────────────────────

router.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }), // raw body — DO NOT put express.json() before this
  paymentController.stripeWebhook
);

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ CALLBACKS
//  These are POST redirects from the SSLCommerz gateway.
//  No auth — SSLCommerz calls these directly.
// ─────────────────────────────────────────────────────────────

router.post("/sslcommerz/success", paymentController.sslCommerzSuccess);
router.post("/sslcommerz/fail", paymentController.sslCommerzFail);
router.post("/sslcommerz/cancel", paymentController.sslCommerzCancel);
router.post("/sslcommerz/ipn", paymentController.sslCommerzIPN);

// ─────────────────────────────────────────────────────────────
//  INITIATE PAYMENT  (student triggers this after booking accepted)
// ─────────────────────────────────────────────────────────────

/**
 * POST /payments/initiate
 * Body: { bookingId: string, gateway: "STRIPE" | "SSLCOMMERZ" }
 *
 * STRIPE response:    { clientSecret, paymentIntentId, amount, currency }
 * SSLCOMMERZ response: { gatewayUrl, transactionId, amount, currency }
 */
router.post(
  "/initiate",
  checkAuth(UserRole.STUDENT),
  validateRequest(PaymentValidation.initiatePaymentSchema),
  paymentController.initiatePayment
);

// ─────────────────────────────────────────────────────────────
//  GET PAYMENT DETAILS
// ─────────────────────────────────────────────────────────────

/**
 * GET /payments/booking/:bookingId
 * Accessible by the student, tutor of that booking, or admin
 */
router.get(
  "/booking/:bookingId",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  paymentController.getPaymentByBooking
);

// ─────────────────────────────────────────────────────────────
//  REFUND  (admin only)
// ─────────────────────────────────────────────────────────────

/**
 * POST /payments/booking/:bookingId/refund
 * Admin triggers a refund for a paid booking
 */
router.post(
  "/booking/:bookingId/refund",
  checkAuth(UserRole.ADMIN),
  paymentController.refundPayment
);

export const PaymentRoutes = router;