import status from "http-status";
import Stripe from "stripe";
import { PaymentStatus, BookingStatus } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelper/AppError";

const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10" as any,
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
const handleStripeWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      envVars.STRIPE.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    throw new AppError(status.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.bookingId;
    
    if (!bookingId) {
      console.warn("Webhook: PaymentIntent missing bookingId in metadata", paymentIntent.id);
      return { success: true, message: "No action taken (missing bookingId)" };
    }

    // অটোমেটিক মিটিং লিঙ্ক জেনারেট (Jitsi/Google Meet)
    const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;

    await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.PAID,
          transactionId: paymentIntent.id, // অটোমেটিক Stripe ID বসবে
          paymentMethod: "STRIPE_CARD",
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: BookingStatus.ACCEPTED,
          meetingLink: meetingLink 
        },
      }),
    ]);

    console.log(`✅ Stripe payment & Meeting Link auto-generated for: ${bookingId}`);
  }

  return { success: true, message: "Webhook processed" };
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

/** অ্যাডমিন বা টিউটর ম্যানুয়াল পেমেন্ট চেক করে অ্যাপ্রুভ করবে */
const approveManualPayment = async (bookingId: string, userId: string, role: string) => {
  const meetingLink = `https://meet.jit.si/TutorByte-${bookingId}`;

  if (role === "TUTOR") {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tutor: true },
    });
    if (!booking || booking.tutor.userId !== userId) {
      throw new AppError(status.FORBIDDEN, "You can only approve payments for your own bookings.");
    }
  }

  return await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data: { status: PaymentStatus.PAID },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: BookingStatus.ACCEPTED,
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
  handleStripeWebhook,
  submitManualPayment,
  approveManualPayment,
};