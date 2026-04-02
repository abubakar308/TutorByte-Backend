export type PaymentGateway = "STRIPE" | "BKASH" | "NAGAD" | "ROCKET";

// ১. Stripe পেমেন্ট শুরু করার জন্য পেলোড
export interface IInitiatePaymentPayload {
  bookingId: string;
  gateway: "STRIPE";
}

// ২. ম্যানুয়াল পেমেন্ট (bKash/Nagad) সাবমিট করার পেলোড
export interface IManualPaymentPayload {
  bookingId: string;
  transactionId: string;
  paymentMethod: "BKASH" | "NAGAD" | "ROCKET";
}

// ৩. Stripe Webhook এর জন্য ইন্টারফেস
export interface IStripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: {
      id: string; // PaymentIntent ID
      metadata: { 
        bookingId: string;
        studentId?: string;
      };
      amount: number; // in cents
      status: string;
      payment_method_types: string[];
      receipt_email?: string;
    };
  };
}

// ৪. পেমেন্ট সাকসেস রেসপন্স (সার্ভিস থেকে যা রিটার্ন হবে)
export interface IPaymentResponse {
  gateway: string;
  clientSecret?: string; // শুধু Stripe এর জন্য
  transactionId?: string; // ম্যানুয়াল বা SSL এর জন্য (যদি পরে লাগে)
  amount: number;
  bookingId: string;
}