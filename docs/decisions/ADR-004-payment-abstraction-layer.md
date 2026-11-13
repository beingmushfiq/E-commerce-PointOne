# ADR-004: Payment Gateway Abstraction & Server-Side Verification

## Status
Accepted

## Context
E-commerce platforms in the South Asian and international market must support multiple disparate payment channels:
- Bangladesh local gateways: bKash (bKash Checkout API), SSLCommerz (Session & IPN), Nagad, aamarPay, ShurjoPay.
- Universal / International: Cash on Delivery (COD), Direct Bank Transfer, Stripe, PayPal.

The existing codebase contained a severe security vulnerability (`PaymentService.php`) where any arbitrary unhandled payment string defaulted to `completed`. Furthermore, client-side browser redirects cannot be trusted to verify payment success due to spoofing, network drops, and replay attacks.

## Decision
1. **Unified Interface (`PaymentGatewayContract`):**
   All payment providers must implement standard methods:
   - `initiatePayment(PaymentRequest $request): PaymentInitResponse`
   - `verifyPayment(string $transactionId): PaymentVerification`
   - `processRefund(RefundRequest $request): RefundResponse`
   - `handleWebhook(WebhookPayload $payload): void`
2. **Server-to-Server Verification Invariant:**
   An order must **never** transition to `paid` or `processing` solely on a browser redirect callback. The backend must independently query the gateway's verification endpoint or validate a cryptographically signed webhook/IPN before updating the order state.
3. **Idempotency Protection:**
   All payment and webhook processing must check against a `payment_idempotency_keys` table. Replayed webhooks return the cached verification outcome without double-processing ledger entries or firing duplicate marketing events.

## Consequences
- **Positive:**
  - Prevents financial fraud and fake order fulfillment.
  - Adding or swapping payment gateways requires zero changes to `CheckoutController` or `Order` domain models.
- **Negative:**
  - Requires maintaining webhook endpoints and sandbox mock servers for automated testing.

