---
id: epic-payments-gateway
title: Payments Gateway (Stripe Connect)
status: draft
owner: davis
priority: P0
target_release: v3-mvp
services_affected:
  - lib/stripe/client.js
  - app/api/checkout/route.js
  - app/api/checkout/create-intent/route.js
  - app/api/stripe/connect/route.js
  - app/api/stripe/webhooks/route.js
  - app/admin/settings/payments/page.js
  - app/marketplace/checkout/page.js
  - components/checkout/CheckoutForm.js
success_metric: >
  A merchant can complete Stripe Connect Express onboarding from their
  dashboard. A consumer can buy a single item (product or event ticket)
  via Stripe Checkout. The platform collects a configurable percentage
  fee on each transaction using Destination Charges. Webhook handlers
  update order status in Firestore in real-time.
stories:
  - story-stripe-connect-onboarding
  - story-checkout-session
  - story-order-tracking
  - story-webhook-handler
dependencies:
  - epic-listing-engine
created_at: 2026-05-01
---

# Epic: Payments Gateway (Stripe Connect)

## Vision

Enable commerce without holding the bag. CentralTexas.com is a
marketplace, not a merchant. The platform facilitates transactions
between consumers and merchants using Stripe Connect Express, which
handles all KYC, tax reporting, and PCI compliance.

The payment model is simple: when a consumer buys a $50 event ticket,
Stripe routes $47 to the merchant and $3 to the platform (6% fee).
The platform never touches the money — Stripe handles splits, payouts,
and 1099 reporting.

For MVP, checkout is **single-item, single-merchant only**. No
multi-vendor carts, no split shipping, no split tax calculations.
The CTA is always "Buy Now" — not "Add to Cart."

## Scope Boundaries

- **IN:** Stripe Connect Express onboarding for merchants, Stripe
  Checkout Sessions for single-item purchase, Destination Charges
  with platform fee, webhook handlers for payment events, order
  documents in Firestore, basic order confirmation page.
- **OUT:** Multi-vendor shopping cart, subscription payments, refund
  management UI (use Stripe dashboard), recurring billing, invoicing,
  physical shipping/fulfillment tracking, tax calculation beyond
  Stripe's defaults.

## Architecture Reference

The existing codebase has a `lib/stripe/client.js` that initializes
the Stripe SDK and `app/api/checkout/` routes for basic checkout.
The v3 refactor adds Stripe Connect integration (merchant onboarding),
Destination Charges (platform fee collection), and a webhook handler.

### Payment Flow
1. Consumer clicks "Buy Now" on a listing
2. Client calls `/api/checkout` with listingId + variantId
3. Server creates a Stripe Checkout Session with `payment_intent_data.transfer_data`
   pointing to the merchant's Connect account
4. Consumer is redirected to Stripe's hosted checkout page
5. On success, Stripe fires a `checkout.session.completed` webhook
6. Webhook handler creates an `orders` document in Firestore
7. Consumer sees confirmation page

## Key Design Decisions

1. **Stripe Checkout (hosted), not Stripe Elements.** Offloads PCI
   compliance entirely. Zero card data touches our servers.
2. **Destination Charges, not Direct Charges.** The platform is the
   payment facilitator. This keeps the consumer-facing charge on our
   account and splits to the merchant.
3. **Single-item checkout only.** No cart. "Buy Now" creates one
   Checkout Session for one listing + one variant. This avoids
   multi-merchant cart splitting.
4. **Platform fee as percentage.** Default 6%, configurable per
   merchant via a `platformFeePercent` field on the site document.
5. **External link fallback.** If a listing has `externalUrl` set,
   the CTA links out instead of creating a Checkout Session.

## Open Questions

- [ ] Platform fee: 6% flat or tiered based on merchant volume?
- [ ] Should we email receipts ourselves (via Resend) or rely on
      Stripe's built-in receipt emails?
- [ ] Do free events (RSVP) create $0 checkout sessions or skip
      Stripe entirely?
