/** Buyer-facing messages for /checkout/failed?reason=… (display only). */
export const VERIFY_CODES_PUBLIC: Record<string, string> = {
  not_paid: "The payment was not completed. You have not been charged.",
  dpo_901: "Your card issuer declined the transaction.",
  dpo_903: "The payment time limit expired. Please start a new booking.",
  dpo_902: "The payment details did not match. Please try again.",
  dpo_003: "Your payment is still pending at the bank. We'll confirm once it clears.",
  dpo_001: "Your payment is authorised but not yet settled.",
  dpo_007: "Your payment is pending.",
  amount_mismatch: "The paid amount did not match your order. Please contact support.",
  mismatch: "This payment does not match your order.",
  missing_token: "We did not receive a payment reference from the payment provider.",
  invalid_order: "This checkout session is invalid or has expired. Please start again.",
  verify_error: "We couldn't confirm your payment with the provider. Please contact support before trying again.",
};
