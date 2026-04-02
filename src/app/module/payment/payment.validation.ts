import { z } from "zod";

// ১. অটোমেটিক পেমেন্ট শুরুর জন্য (Stripe)
const initiatePaymentSchema = z.object({
  body: z.object({
    bookingId: z.string({
      message: "Booking ID is required.",
    }).uuid("Invalid booking ID format."),
    gateway: z.enum(["STRIPE"], {
      message: "Gateway is required and must be STRIPE.",
    }),
  }),
});

// ২. ম্যানুয়াল পেমেন্ট সাবমিশনের জন্য (bKash/Nagad/Rocket)
const manualPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string({
      message: "Booking ID is required.",
    }).uuid("Invalid booking ID format."),
    transactionId: z.string({
      message: "Transaction ID (TxID) is required.",
    }).min(8, "Transaction ID is too short.")
      .max(25, "Transaction ID is too long."),
    paymentMethod: z.enum(["BKASH", "NAGAD", "ROCKET"], {
      message: "Payment method is required (BKASH, NAGAD, or ROCKET).",
    }),
  }),
});

export const PaymentValidation = {
  initiatePaymentSchema,
  manualPaymentSchema,
};