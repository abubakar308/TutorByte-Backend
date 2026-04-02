import status from "http-status";
import Stripe from "stripe";
import { PaymentStatus, BookingStatus } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelper/AppError";

const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

// ─────────────────────────────────────────────────────────────
//  STRIPE - AUTOMATIC FLOW
// ─────────────────────────────────────────────────────────────

/** পেমেন্ট ইন্টেন্ট তৈরি করা */
const initiateStripePayment = async (booking: any) => {
  const amountInCents = Math.round(Number(booking.totalPrice) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: { bookingId: booking.id },
    receipt_email: booking.student.email,
  });

  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId: paymentIntent.id,
      paymentMethod: "STRIPE",
    },
    update: { transactionId: paymentIntent.id },
  });

  return {
    gateway: "STRIPE",
    clientSecret: paymentIntent.client_secret,
    amount: Number(booking.totalPrice),
  };
};

/** Stripe Webhook Handler - পেমেন্ট সফল হলে মিটিং লিঙ্ক জেনারেট করবে */
const handleStripeSuccess = async (intent: Stripe.PaymentIntent) => {
  const bookingId = intent.metadata?.bookingId;
  if (!bookingId) return;

  // অটোমেটিক মিটিং লিঙ্ক জেনারেট (Jitsi/Google Meet)
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.PAID,
        transactionId: intent.id, // অটোমেটিক Stripe ID বসবে
        paymentMethod: "STRIPE_CARD",
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.PAID,
        meetingLink: meetingLink 
      },
    }),
  ]);

  console.log(`✅ Stripe payment & Meeting Link auto-generated for: ${bookingId}`);
};

// ─────────────────────────────────────────────────────────────
//  BKASH/NAGAD - MANUAL FLOW
// ─────────────────────────────────────────────────────────────

/** স্টুডেন্ট ম্যানুয়ালি TxID সাবমিট করবে */
const submitManualPayment = async (
  studentId: string, 
  payload: { bookingId: string; transactionId: string; paymentMethod: string }
) => {
  const { bookingId, transactionId, paymentMethod } = payload;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking || booking.studentId !== studentId) {
    throw new AppError(status.FORBIDDEN, "Invalid booking or access denied.");
  }

  // পেমেন্ট রেকর্ড PENDING থাকবে যতক্ষণ না অ্যাডমিন অ্যাপ্রুভ করে
  return await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.totalPrice,
      status: PaymentStatus.PENDING,
      transactionId, // স্টুডেন্টের দেওয়া বিকাশ/নগদ TxID
      paymentMethod, 
    },
    update: { transactionId, status: PaymentStatus.PENDING },
  });
};

/** অ্যাডমিন ম্যানুয়াল পেমেন্ট চেক করে অ্যাপ্রুভ করবে */
const approveManualPayment = async (bookingId: string) => {
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;

  return await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.PAID },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.PAID,
        meetingLink: meetingLink 
      },
    }),
  ]);
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const paymentService = {
  initiateStripePayment,
  handleStripeSuccess,
  submitManualPayment,
  approveManualPayment,
  // Webhook Signature verification function here...
};