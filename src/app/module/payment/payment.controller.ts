import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { paymentService } from "./payment.service";
import { IRequestUser } from "../auth/auth.interface";
import { envVars } from "../../config/env";

// ─────────────────────────────────────────────────────────────
//  INITIATE  (Stripe or SSLCommerz)
// ─────────────────────────────────────────────────────────────

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await paymentService.initiatePayment(user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message:
      result.gateway === "STRIPE"
        ? "Stripe PaymentIntent created. Use clientSecret on frontend."
        : "SSLCommerz session created. Redirect user to gatewayUrl.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  STRIPE WEBHOOK
//  ⚠️  Must receive RAW body — configured in routes with express.raw()
// ─────────────────────────────────────────────────────────────

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    res.status(status.BAD_REQUEST).json({
      success: false,
      message: "Missing Stripe-Signature header.",
    });
    return;
  }

  // req.body is raw Buffer here (express.raw middleware on this route)
  const result = await paymentService.handleStripeWebhook(req.body, signature);

  // Stripe requires a 200 response quickly — do NOT use sendResponse wrapper
  res.status(status.OK).json(result);
});

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ CALLBACKS  (POST redirects from SSLCommerz gateway)
// ─────────────────────────────────────────────────────────────

const sslCommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleSSLCommerzSuccess(req.body);

  // Redirect to frontend success page
  const redirectUrl = result.alreadyPaid
    ? `${envVars.CLIENT_URL}/payment/success?bookingId=${result.bookingId}&already=true`
    : `${envVars.CLIENT_URL}/payment/success?bookingId=${result.bookingId}`;

  res.redirect(redirectUrl);
});

const sslCommerzFail = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleSSLCommerzFail(req.body);
  res.redirect(
    `${envVars.CLIENT_URL}/payment/failed?bookingId=${result.bookingId ?? ""}`
  );
});

const sslCommerzCancel = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleSSLCommerzCancel(req.body);
  res.redirect(
    `${envVars.CLIENT_URL}/payment/cancelled?bookingId=${result.bookingId ?? ""}`
  );
});

// IPN — server-to-server, no redirect
const sslCommerzIPN = catchAsync(async (req: Request, res: Response) => {
  await paymentService.handleSSLCommerzIPN(req.body);
  res.status(status.OK).json({ received: true });
});

// ─────────────────────────────────────────────────────────────
//  GET PAYMENT BY BOOKING
// ─────────────────────────────────────────────────────────────

const getPaymentByBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await paymentService.getPaymentByBooking(
    user.userId,
    user.role,
    req.params.bookingId
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  REFUND  (admin only)
// ─────────────────────────────────────────────────────────────

const refundPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.refundPayment(req.params.bookingId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const paymentController = {
  initiatePayment,
  stripeWebhook,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  sslCommerzIPN,
  getPaymentByBooking,
  refundPayment,
};