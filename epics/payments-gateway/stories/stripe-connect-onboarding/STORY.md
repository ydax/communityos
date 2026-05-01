---
id: story-stripe-connect-onboarding
epic: epic-payments-gateway
title: Stripe Connect Express Onboarding
status: ready
priority: P0
persona: merchant
points: 5
depends_on:
  - story-merchant-profile-form
blocked_by: []
services_affected:
  - lib/stripe/client.js
  - app/api/stripe/connect/route.js
  - app/admin/settings/payments/page.js
  - lib/dbServices/sitesService.js
experimental: false
created_at: 2026-05-01
---

# Story: Stripe Connect Express Onboarding

## User Story

**As a** merchant who wants to sell products or tickets on CentralTexas.com,
**I want** to connect my bank account through a simple onboarding flow,
**So that** I can receive payments directly without sharing sensitive financial information with the platform.

## Context

Stripe Connect Express handles all KYC (Know Your Customer) verification,
bank account setup, and identity verification on Stripe's hosted UI. The
merchant clicks a button in their dashboard, completes the Stripe flow,
and returns to CommunityOS with their account linked.

The platform stores the merchant's `stripeConnectAccountId` on their site
document. This ID is used when creating Checkout Sessions to route payments
via Destination Charges.

## Acceptance Criteria

```gherkin
Feature: Stripe Connect Express Onboarding

  Scenario: Merchant initiates Stripe onboarding
    Given a merchant on their dashboard settings page
    When they click "Connect Bank Account"
    Then the server creates a Stripe Account Link
    And the merchant is redirected to Stripe's hosted onboarding UI

  Scenario: Merchant completes Stripe onboarding
    Given a merchant has completed Stripe's KYC flow
    When Stripe redirects them back to the return URL
    Then the site document is updated with stripeConnectAccountId
    And the dashboard shows "Payments Connected ✓" with a green badge
    And "Buy Now" buttons are enabled on their listings

  Scenario: Merchant abandons onboarding
    Given a merchant starts Stripe onboarding but does not complete it
    When they return to the dashboard
    Then the status shows "Payments Setup Incomplete"
    And a "Resume Setup" button allows them to continue

  Scenario: Listings without Stripe show fallback CTA
    Given a merchant who has NOT completed Stripe onboarding
    When a consumer views their listing detail page
    Then the CTA button says "Contact Seller" instead of "Buy Now"
    And clicking it opens a contact form (not Stripe checkout)

  Scenario: Merchant's Stripe account status is verified on return
    Given a merchant returning from Stripe onboarding
    When the return handler fires
    Then the server calls stripe.accounts.retrieve(accountId)
    And checks that charges_enabled is true
    And only then marks the merchant as payment-ready
```

## Design Notes

- "Connect Bank Account" button: prominent card on the settings page
- Connected state: show green check with masked bank account info
- Use the Standard Card style for the payments settings section
- Stripe's hosted UI handles all sensitive data collection — no custom forms

## Out of Scope

- Stripe Identity verification beyond what Connect Express requires
- Custom Stripe dashboard or payout schedule management
- Multi-currency support
- Stripe Connect Standard or Custom account types

## Implementation Reference

- Stripe SDK: `lib/stripe/client.js`
- Connect API: `app/api/stripe/connect/route.js` (new)
- Settings page: `app/admin/settings/payments/page.js` (new)
- Sites DB: `lib/dbServices/sitesService.js` (add stripeConnectAccountId field)
