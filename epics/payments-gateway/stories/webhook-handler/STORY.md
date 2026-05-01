---
id: story-webhook-handler
epic: epic-payments-gateway
title: Stripe Webhook Handler
status: ready
priority: P0
persona: developer
points: 3
depends_on:
  - story-checkout-session
blocked_by: []
services_affected:
  - app/api/stripe/webhooks/route.js
  - lib/dbServices/ordersService.js
  - lib/dbServices/inventoryService.js
experimental: false
created_at: 2026-05-01
---

# Story: Stripe Webhook Handler

## User Story

**As a** developer ensuring payment reliability,
**I want** a webhook endpoint that processes Stripe payment events,
**So that** order records and inventory are updated even if the consumer closes the browser after paying.

## Context

Stripe Checkout redirects are not reliable — a consumer can close the
browser after payment but before reaching the confirmation page. The
webhook is the authoritative signal that payment succeeded.

The webhook endpoint at `/api/stripe/webhooks` receives signed events
from Stripe, verifies the signature, and processes relevant event types.

For MVP, we handle:
- `checkout.session.completed` → create order, decrement inventory
- `checkout.session.expired` → clean up any pending state

## Acceptance Criteria

```gherkin
Feature: Stripe Webhook Handler

  Scenario: Webhook creates order on payment success
    Given a valid checkout.session.completed event
    When the webhook endpoint receives it
    Then it verifies the Stripe signature
    And creates an order document in Firestore
    And decrements variant inventoryCount by the purchased quantity
    And returns HTTP 200

  Scenario: Webhook rejects invalid signature
    Given a webhook request with an invalid signature
    When the endpoint attempts verification
    Then it returns HTTP 400
    And no order document is created

  Scenario: Webhook handles duplicate events idempotently
    Given a checkout.session.completed event for session "cs_123"
    And an order already exists with stripeSessionId "cs_123"
    When the webhook receives the same event again
    Then it skips order creation
    And returns HTTP 200 (not an error)

  Scenario: Webhook handles expired sessions
    Given a checkout.session.expired event
    When the webhook processes it
    Then no order is created
    And any pending inventory hold is released

  Scenario: Inventory decrements on purchase
    Given a variant with inventoryCount 50
    When a checkout.session.completed event fires for quantity 2
    Then the variant inventoryCount is decremented to 48
    And a Firestore transaction ensures atomicity
```

## Design Notes

- Use `stripe.webhooks.constructEvent()` for signature verification
- The webhook signing secret is stored in `STRIPE_WEBHOOK_SECRET` env var
- Log all received events for debugging
- Use raw body parsing (not JSON) for Stripe signature verification

## Out of Scope

- Payment dispute/chargeback handling
- Refund webhooks
- Payout webhooks (merchant payout status)
- Real-time inventory hold/reservation system

## Implementation Reference

- Webhook route: `app/api/stripe/webhooks/route.js` (new)
- Orders DB: `lib/dbServices/ordersService.js`
- Inventory: `lib/dbServices/inventoryService.js`
- Stripe SDK: `lib/stripe/client.js`

