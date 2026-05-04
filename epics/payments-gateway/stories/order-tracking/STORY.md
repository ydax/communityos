---
id: story-order-tracking
epic: epic-payments-gateway
title: Order Document & Confirmation
status: ready
priority: P1
persona: merchant
points: 3
depends_on:
  - story-checkout-session
blocked_by: []
services_affected:
  - lib/dbServices/ordersService.js
  - app/admin/orders/page.js
experimental: false
created_at: 2026-05-01
---

# Story: Order Document & Confirmation

## User Story

**As a** merchant who received a payment,
**I want** to see a record of the order in my dashboard,
**So that** I know who purchased what and can fulfill the order.

## Context

When a Stripe Checkout Session completes, the webhook handler creates an
`orders` document in Firestore. This document records the buyer, listing,
variant, amount, platform fee, and Stripe payment intent ID.

The merchant dashboard gets a new `/admin/orders` page showing a table
of all orders sorted by date.

## Acceptance Criteria

```gherkin
Feature: Order Document & Confirmation

  Scenario: Order document is created on successful payment
    Given a consumer completes a Stripe Checkout Session
    When the checkout.session.completed webhook fires
    Then an order document is created in the "orders" collection
    And it contains: buyerEmail, listingId, variantId, amount, platformFee, stripePaymentIntentId, status "completed", createdAt

  Scenario: Merchant views orders in dashboard
    Given a merchant with 5 completed orders
    When they navigate to /admin/orders
    Then they see a table with 5 rows
    And each row shows: date, buyer email, listing title, amount, status

  Scenario: Order links to listing
    Given an order for listing "Farm Festival VIP"
    When the merchant clicks the listing title in the orders table
    Then they navigate to the listing edit page

  Scenario: Empty orders state
    Given a merchant with no orders yet
    When they visit /admin/orders
    Then a friendly empty state shows "No orders yet"
    And text: "Orders will appear here when customers make purchases"
```

## Design Notes

- Orders table: clean, compact rows with `docs/DESIGN.md` table styling
- Status badge: green "Completed", yellow "Pending", red "Refunded"
- Date format: relative ("2 hours ago") with hover for full timestamp
- Mobile: cards instead of table rows

## Out of Scope

- Order detail page with full receipt
- Refund initiation from the dashboard (use Stripe dashboard)
- Order status email notifications to merchants
- Consumer order history page

## Implementation Reference

- Orders DB: `lib/dbServices/ordersService.js`
- Orders page: `app/admin/orders/page.js` (new)

 
