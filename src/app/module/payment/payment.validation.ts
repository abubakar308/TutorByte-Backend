import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("Invalid booking ID."),
    gateway: z.enum(["STRIPE", "SSLCOMMERZ"], {
      required_error: "gateway is required.",
      message: "gateway must be STRIPE or SSLCOMMERZ.",
    }),
  }),
});

export const PaymentValidation = {
  initiatePaymentSchema,
};