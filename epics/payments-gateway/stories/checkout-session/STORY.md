---
id: story-checkout-session
epic: epic-payments-gateway
title: Single-Item Checkout via Stripe
status: ready
priority: P0
persona: consumer
points: 5
depends_on:
  - story-stripe-connect-onboarding
  - story-polymorphic-schema
blocked_by: []
services_affected:
  - app/api/checkout/route.js
  - app/api/checkout/create-intent/route.js
  - app/marketplace/checkout/page.js
  - components/checkout/CheckoutForm.js
experimental: false
created_at: 2026-05-01
---

# Story: Single-Item Checkout via Stripe

## User Story

**As a** consumer who wants to buy a product or event ticket,
**I want** to click "Buy Now" and complete payment on a secure checkout page,
**So that** I can purchase items from local merchants safely and quickly.

## Context

Checkout uses Stripe Checkout Sessions (hosted by Stripe). The consumer
never enters card details on CommunityOS — they are redirected to Stripe's
hosted page and returned after payment.

The server creates the Checkout Session with a Destination Charge:
- The `line_items` contain the listing price (basePrice + variant priceDelta)
- `payment_intent_data.application_fee_amount` is the platform fee (6% default)
- `payment_intent_data.transfer_data.destination` is the merchant's Stripe Connect account ID

On successful payment, the consumer is redirected to a confirmation page.

## Acceptance Criteria

```gherkin
Feature: Single-Item Checkout

  Scenario: Consumer purchases an event ticket
    Given an event listing "Farm Festival" with basePrice 5000 (i.e., $50)
    And a VIP variant with priceDelta 2500 (i.e., total $75)
    And the merchant has a connected Stripe account
    When the consumer selects "VIP" and clicks "Get Tickets"
    Then the server creates a Stripe Checkout Session
    And the line item total is $75.00
    And the platform fee is $4.50 (6% of $75)
    And the consumer is redirected to Stripe's checkout page

  Scenario: Consumer completes payment
    Given a consumer on Stripe's checkout page
    When they enter valid card details and click "Pay"
    Then Stripe processes the payment
    And redirects to /marketplace/checkout?session_id={id}
    And the confirmation page shows "Payment Successful!"
    And displays order details (listing title, quantity, amount)

  Scenario: Consumer cancels payment
    Given a consumer on Stripe's checkout page
    When they click "Back" or close the tab
    Then no payment is processed
    And returning to the listing shows the "Buy Now" button unchanged

  Scenario: Listing with external URL uses link fallback
    Given a restaurant listing with externalUrl "https://toast.com/joes-bbq"
    When a consumer clicks the CTA button
    Then they are navigated to the external URL in a new tab
    And no Stripe Checkout Session is created

  Scenario: Checkout fails for unconnected merchant
    Given a listing whose merchant has NOT completed Stripe onboarding
    When the server attempts to create a Checkout Session
    Then it returns a 400 error: "This merchant has not enabled payments"
    And the consumer sees a friendly error message
```

## Design Notes

- "Buy Now" / "Get Tickets" button uses Primary Button style
- Variant selector (if applicable) above the CTA button
- Quantity selector: default 1, max 10 for MVP
- Confirmation page: Standard Card with check icon, order summary, and "Browse More" link
- Loading state while creating Checkout Session: button shows spinner

## Out of Scope

- Multi-item or multi-merchant cart
- Guest checkout (consumer must have an account to track orders)
- Promo codes or discount coupons
- Saved payment methods

## Implementation Reference

- Checkout API: `app/api/checkout/route.js`, `app/api/checkout/create-intent/route.js`
- Confirmation page: `app/marketplace/checkout/page.js`
- Stripe SDK: `lib/stripe/client.js`
- Checkout UI: `components/checkout/CheckoutForm.js`

