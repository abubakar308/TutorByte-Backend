import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { paymentService } from "./payment.service";
import { IRequestUser } from "../auth/auth.interface";
import { envVars } from "../../config/env";

// ─────────────────────────────────────────────────────────────
//  INITIATE STRIPE (Automatic)
// ─────────────────────────────────────────────────────────────
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  // এটি শুধু Stripe এর জন্য PaymentIntent তৈরি করবে
  const result = await paymentService.initiateStripePayment(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Stripe PaymentIntent created. Complete payment on frontend.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  STRIPE WEBHOOK (Automatic Success Handler)
// ─────────────────────────────────────────────────────────────
const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    res.status(status.BAD_REQUEST).json({ success: false, message: "No signature." });
    return;
  }

  // Webhook পেমেন্ট সফল হলে অটোমেটিক মিটিং লিঙ্ক তৈরি করবে (Service-এ ডিফাইন করা)
  const result = await paymentService.handleStripeWebhook(req.body, signature);

  res.status(status.OK).json(result);
});

// ─────────────────────────────────────────────────────────────
//  MANUAL PAYMENT (bKash/Nagad/Rocket)
// ─────────────────────────────────────────────────────────────

/** স্টুডেন্ট যখন ম্যানুয়ালি TxID সাবমিট করবে */
const submitManualPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await paymentService.submitManualPayment(user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Manual payment submitted. Waiting for admin approval.",
    data: result,
  });
});

/** অ্যাডমিন যখন পেমেন্ট চেক করে অ্যাপ্রুভ করবে */
const approveManualPayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await paymentService.approveManualPayment(req.params.bookingId as string, user.userId, user.role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment approved and meeting link generated.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  OTHERS
// ─────────────────────────────────────────────────────────────

// const getPaymentByBooking = catchAsync(async (req: Request, res: Response) => {
//   const user = req.user as IRequestUser;

//   const result = await paymentService.getPaymentByBooking(
//     user.userId,
//     user.role,
//     req.params.bookingId
//   );

//   sendResponse(res, {
//     httpStatusCode: status.OK,
//     success: true,
//     message: "Payment fetched successfully.",
//     data: result,
//   });
// });

// const refundPayment = catchAsync(async (req: Request, res: Response) => {
//   const result = await paymentService.refundPayment(req.params.bookingId);

//   sendResponse(res, {
//     httpStatusCode: status.OK,
//     success: true,
//     message: result.message,
//     data: null,
//   });
// });

export const paymentController = {
  initiatePayment,
  stripeWebhook,
  submitManualPayment,
  approveManualPayment
};