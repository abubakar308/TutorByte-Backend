export type PaymentGateway = "STRIPE" | "SSLCOMMERZ";

export interface IInitiatePaymentPayload {
  bookingId: string;
  gateway: PaymentGateway;
}

export interface IStripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: {
      id: string;                    // PaymentIntent id
      metadata: { bookingId: string };
      amount: number;                // in cents
      status: string;
      payment_method_types: string[];
    };
  };
}

export interface ISSLCommerzSuccessPayload {
  tran_id: string;          // our bookingId
  val_id: string;
  amount: string;
  card_type: string;
  store_amount: string;
  bank_tran_id: string;
  status: string;
  currency: string;
  [key: string]: string;   // SSLCommerz sends many extra fields
}