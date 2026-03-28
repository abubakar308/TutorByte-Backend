import status from "http-status";
import Stripe from "stripe";

import { PaymentStatus, BookingStatus } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelper/AppError";
import { IInitiatePaymentPayload, ISSLCommerzSuccessPayload } from "./payment.interfacae";


// ─────────────────────────────────────────────────────────────
//  CLIENTS
// ─────────────────────────────────────────────────────────────

const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Load booking with all relations needed for payment */
const getBookingForPayment = async (bookingId: string, studentId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found.");
  }

  // Only the student who made the booking can pay
  if (booking.studentId !== studentId) {
    throw new AppError(status.FORBIDDEN, "You can only pay for your own bookings.");
  }

  // Only ACCEPTED bookings can be paid
  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot pay for a booking with status: ${booking.status}. Booking must be ACCEPTED first.`
    );
  }

  // Already paid?
  if (booking.payment?.status === PaymentStatus.PAID) {
    throw new AppError(status.CONFLICT, "This booking has already been paid.");
  }

  return booking;
};

// ─────────────────────────────────────────────────────────────
//  INITIATE PAYMENT  (entry point — routes to Stripe or SSLCommerz)
// ─────────────────────────────────────────────────────────────

const initiatePayment = async (
  studentId: string,
  payload: IInitiatePaymentPayload
) => {
  const { bookingId, gateway } = payload;
  const booking = await getBookingForPayment(bookingId, studentId);

  if (gateway === "STRIPE") {
    return initiateStripePayment(booking);
  } else {
    return initiateSSLCommerzPayment(booking);
  }
};

// ─────────────────────────────────────────────────────────────
//  STRIPE — initiate
// ─────────────────────────────────────────────────────────────

const initiateStripePayment = async (booking: Awaited<ReturnType<typeof getBookingForPayment>>) => {
  // Amount in cents (Stripe requires integer)
  const amountInCents = Math.round(Number(booking.totalPrice) * 100);

  // Create a PaymentIntent — the frontend uses the client_secret
  // to render Stripe Elements / confirm payment on client side
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      bookingId: booking.id,
      studentId: booking.studentId,
      tutorId: booking.tutorId,
    },
    description: `TutorByte session with ${booking.tutor.user.name}`,
    receipt_email: booking.student.email,
  });

  // Create a PENDING payment record (will be updated by webhook)
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId: paymentIntent.id,
      paymentMethod: "STRIPE",
    },
    update: {
      // If retrying, refresh the transactionId
      transactionId: paymentIntent.id,
      status: PaymentStatus.PENDING,
      paymentMethod: "STRIPE",
    },
  });

  return {
    gateway: "STRIPE",
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: Number(booking.totalPrice),
    currency: "usd",
    booking: {
      id: booking.id,
      tutorName: booking.tutor.user.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  STRIPE — webhook handler
//  Called by POST /payments/webhook/stripe
//  Express must use raw body for this route (see routes file)
// ─────────────────────────────────────────────────────────────

const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string
) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_SECRET_KEY
    );
  } catch {
    throw new AppError(status.BAD_REQUEST, "Invalid Stripe webhook signature.");
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handleStripeSuccess(intent);
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await handleStripeFailure(intent);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleStripeRefund(charge);
      break;
    }

    default:
      // Unhandled event type — ignore but don't throw
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return { received: true };
};

const handleStripeSuccess = async (intent: Stripe.PaymentIntent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;

  const paymentMethodType = intent.payment_method_types?.[0] ?? "card";

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.PAID,
        transactionId: intent.id,
        paymentMethod: `STRIPE_${paymentMethodType.toUpperCase()}`,
      },
    }),
    // Keep booking as ACCEPTED — tutor marks COMPLETED after session
    // But we can set meetingLink here if needed in future
  ]);

  console.log(`✅ Stripe payment succeeded for booking: ${bookingId}`);
};

const handleStripeFailure = async (intent: Stripe.PaymentIntent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;

  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: PaymentStatus.FAILED,
      transactionId: intent.id,
    },
  });

  console.log(`❌ Stripe payment failed for booking: ${bookingId}`);
};

const handleStripeRefund = async (charge: Stripe.Charge) => {
  // Find payment by Stripe PaymentIntent id stored in transactionId
  const payment = await prisma.payment.findFirst({
    where: { transactionId: charge.payment_intent as string },
  });

  if (!payment) return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    }),
    prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED },
    }),
  ]);

  console.log(`↩️  Stripe refund processed for booking: ${payment.bookingId}`);
};

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ — initiate
// ─────────────────────────────────────────────────────────────

const initiateSSLCommerzPayment = async (
  booking: Awaited<ReturnType<typeof getBookingForPayment>>
) => {
  // TODO: Uncomment and implement SSLCommerz payment when library is available
  // const isLive = envVars.SSLCOMMERZ_IS_LIVE;
  // const sslcz = new SSLCommerzPayment(
  //   envVars.SSLCOMMERZ_STORE_ID,
  //   envVars.SSLCOMMERZ_STORE_PASS,
  //   isLive
  // );

  const transactionId = `TB-${booking.id}-${Date.now()}`;

  const sslData = {
    total_amount: Number(booking.totalPrice),
    currency: "BDT",
    tran_id: transactionId,

    // Redirect URLs — frontend handles these pages
    // success_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/success`,
    // fail_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/fail`,
    // cancel_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/cancel`,
    // ipn_url: `${envVars.API_URL}/api/v1/payments/sslcommerz/ipn`,

    // Customer info
    cus_name: booking.student.name,
    cus_email: booking.student.email,
    // cus_phone: booking.student.phone ?? "01700000000",
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",

    // Product info
    product_name: `Tutoring Session – ${booking.tutor.user.name}`,
    product_category: "Education",
    product_profile: "general",

    // Shipping (required by SSLCommerz even for digital goods)
    shipping_method: "NO",
    num_of_item: 1,
    ship_name: booking.student.name,
    ship_add1: "Dhaka",
    ship_city: "Dhaka",
    ship_country: "Bangladesh",

    // Store the bookingId so we can match on callback
    value_a: booking.id,
  };

  // TODO: Uncomment when SSLCommerz SDK is available
  // const apiResponse = await sslcz.init(sslData);
  // if (!apiResponse?.GatewayPageURL) {
  //   throw new AppError(
  //     status.BAD_GATEWAY,
  //     "Failed to initialize SSLCommerz payment. Please try again."
  //   );
  // }

  // Create PENDING payment record
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId,
      paymentMethod: "SSLCOMMERZ",
    },
    update: {
      transactionId,
      status: PaymentStatus.PENDING,
      paymentMethod: "SSLCOMMERZ",
    },
  });

  // TODO: Return actual gateway URL when SSLCommerz SDK is available
  return {
    gateway: "SSLCOMMERZ",
    gatewayUrl: "https://test.sslcommerz.com/gw/payment/paymentApi", // Placeholder URL
    transactionId,
    amount: Number(booking.totalPrice),
    currency: "BDT",
    booking: {
      id: booking.id,
      tutorName: booking.tutor.user.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ — success callback  (redirect from gateway)
// ─────────────────────────────────────────────────────────────

const handleSSLCommerzSuccess = async (payload: ISSLCommerzSuccessPayload) => {
  const { tran_id, val_id, bank_tran_id, card_type, status: sslStatus } = payload;

  if (sslStatus !== "VALID" && sslStatus !== "VALIDATED") {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment validation failed. Status: " + sslStatus
    );
  }

  // Validate with SSLCommerz server (prevent replay attacks)
//   const sslcz = new SSLCommerzPayment(
//     envVars.SSLCOMMERZ_STORE_ID,
//     envVars.SSLCOMMERZ_STORE_PASS,
//     envVars.SSLCOMMERZ_IS_LIVE
//   );

//   const validationResponse = await sslcz.validate({ val_id });

//   if (
//     validationResponse.status !== "VALID" &&
//     validationResponse.status !== "VALIDATED"
//   ) {
//     throw new AppError(status.BAD_REQUEST, "SSLCommerz server validation failed.");
//   }

  // Find payment by transactionId (tran_id we generated)
  const payment = await prisma.payment.findFirst({
    where: { transactionId: tran_id },
    include: { booking: true },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment record not found.");
  }

  if (payment.status === PaymentStatus.PAID) {
    // Already processed (IPN arrived first) — just redirect
    return { bookingId: payment.bookingId, alreadyPaid: true };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      transactionId: bank_tran_id || tran_id,
      paymentMethod: `SSLCOMMERZ_${(card_type ?? "CARD").toUpperCase().replace(/ /g, "_")}`,
    },
  });

  console.log(`✅ SSLCommerz payment succeeded for booking: ${payment.bookingId}`);

  return { bookingId: payment.bookingId, alreadyPaid: false };
};

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ — fail callback
// ─────────────────────────────────────────────────────────────

const handleSSLCommerzFail = async (payload: ISSLCommerzSuccessPayload) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  return { bookingId: payment?.bookingId ?? null };
};

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ — cancel callback
// ─────────────────────────────────────────────────────────────

const handleSSLCommerzCancel = async (payload: ISSLCommerzSuccessPayload) => {
  // Payment cancelled by user — leave booking as ACCEPTED
  // so they can retry payment
  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id },
  });

  return { bookingId: payment?.bookingId ?? null };
};

// ─────────────────────────────────────────────────────────────
//  SSLCOMMERZ — IPN  (Instant Payment Notification — server-to-server)
//  SSLCommerz hits this even if user closes browser after paying
// ─────────────────────────────────────────────────────────────

const handleSSLCommerzIPN = async (payload: ISSLCommerzSuccessPayload) => {
  if (payload.status !== "VALID" && payload.status !== "VALIDATED") return;

  const payment = await prisma.payment.findFirst({
    where: { transactionId: payload.tran_id },
  });

  if (!payment || payment.status === PaymentStatus.PAID) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.PAID,
      transactionId: payload.bank_tran_id || payload.tran_id,
      paymentMethod: `SSLCOMMERZ_${(payload.card_type ?? "CARD").toUpperCase().replace(/ /g, "_")}`,
    },
  });

  console.log(`✅ SSLCommerz IPN processed for booking: ${payment.bookingId}`);
};

// ─────────────────────────────────────────────────────────────
//  GET PAYMENT BY BOOKING
// ─────────────────────────────────────────────────────────────

const getPaymentByBooking = async (
  requesterId: string,
  requesterRole: string,
  bookingId: string
) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          tutor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found for this booking.");
  }

  // Only student, tutor, or admin can view
  const isStudent = payment.booking.studentId === requesterId;
  const isTutor = payment.booking.tutor.userId === requesterId;
  const isAdmin = requesterRole === "ADMIN";

  if (!isStudent && !isTutor && !isAdmin) {
    throw new AppError(status.FORBIDDEN, "You do not have access to this payment.");
  }

  return payment;
};

// ─────────────────────────────────────────────────────────────
//  REFUND  (admin only)
// ─────────────────────────────────────────────────────────────

const refundPayment = async (bookingId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (!payment) {
    throw new AppError(status.NOT_FOUND, "Payment not found.");
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      `Cannot refund a payment with status: ${payment.status}.`
    );
  }

  if (payment.paymentMethod.startsWith("STRIPE")) {
    // Find the PaymentIntent and refund via Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 1,
    });

    // Look up by metadata (we stored bookingId in metadata on creation)
    const intent = await stripe.paymentIntents.retrieve(payment.transactionId);

    if (intent.latest_charge) {
      await stripe.refunds.create({
        charge: intent.latest_charge as string,
      });
      // Stripe will fire a "charge.refunded" webhook which updates DB
      return { message: "Refund initiated via Stripe. Status will update via webhook." };
    }
  }

  if (payment.paymentMethod.startsWith("SSLCOMMERZ")) {
    // SSLCommerz refund API
    // const sslcz = new SSLCommerzPayment(
    //   envVars.SSLCOMMERZ_STORE_ID,
    //   envVars.SSLCOMMERZ_STORE_PASS,
    //   envVars.SSLCOMMERZ_IS_LIVE
    // );

    const refundResponse = await sslcz.initiateRefund({
      refund_amount: Number(payment.amount),
      refund_remarks: "TutorByte session cancelled",
      bank_tran_id: payment.transactionId,
      refe_id: `REFUND-${payment.id}`,
    });

    if (refundResponse.APIConnect === "DONE") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        }),
      ]);

      return { message: "Refund processed successfully via SSLCommerz." };
    }

    throw new AppError(status.BAD_GATEWAY, "SSLCommerz refund failed. Please try manually.");
  }

  throw new AppError(status.BAD_REQUEST, "Unknown payment method.");
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const paymentService = {
  initiatePayment,
  handleStripeWebhook,
  handleSSLCommerzSuccess,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
  handleSSLCommerzIPN,
  getPaymentByBooking,
  refundPayment,
};