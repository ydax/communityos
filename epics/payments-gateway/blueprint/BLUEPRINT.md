# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Architecture & Core Entities

### Entities
| Entity | Field | Type | Description |
|---|---|---|---|
| `sites` | `stripeConnectAccountId` | String (Nullable) | The Stripe Connect Express account ID for the merchant. Used to route payments via Destination Charges. |

## 2. State Machines

### Merchant Stripe Onboarding Status
| State | Trigger | Next State | Description |
|---|---|---|---|
| `NOT_CONNECTED` | Merchant clicks "Connect Bank Account" | `PENDING` | Initiates Stripe Account Link creation and redirects merchant to Stripe's hosted UI. |
| `PENDING` | Merchant abandons or fails KYC | `PENDING` | Merchant returns to dashboard but `charges_enabled` is false. Shows "Resume Setup" button. |
| `PENDING` | Merchant completes KYC | `CONNECTED` | Merchant returns, `charges_enabled` is true. DB is updated with `stripeConnectAccountId`. |
| `CONNECTED` | N/A | N/A | Merchant can receive payments. "Buy Now" buttons are enabled on their listings. |

## 3. Gherkin Scenarios

### Epic: Payments Gateway (Stripe Connect)
#### Story: Stripe Connect Express Onboarding

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

## 4. Component Specifications

| Component | File Path | Design System Classes / Notes |
|---|---|---|
| **Payments Settings Card** | `app/admin/settings/payments/page.js` | **Container:** `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`<br>**Title:** `font-outfit text-2xl font-semibold text-slate-900 leading-snug`<br>**Primary Button (Connect):** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`<br>**Secondary Button (Resume):** `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`<br>**Success Badge:** `bg-emerald-100 text-emerald-700 font-inter text-sm font-medium rounded-full px-3 py-1`<br>**Warning Badge:** `bg-amber-100 text-amber-700 font-inter text-sm font-medium rounded-full px-3 py-1` |
| **Listing Detail CTA** | `components/listings/ListingCTA.js` (or similar) | **Fallback Button (Contact Seller):** `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]` |