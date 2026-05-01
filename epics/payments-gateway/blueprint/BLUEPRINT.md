# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Order` | Represents a completed or pending purchase. | `id`, `listingId`, `variantId`, `quantity`, `totalAmount`, `platformFee`, `merchantId`, `consumerId`, `stripeSessionId`, `status` |
| `Listing` | The item or event being sold. | `id`, `merchantId`, `title`, `basePrice`, `externalUrl` |
| `Variant` | Specific option for a listing (e.g., VIP ticket). | `id`, `listingId`, `name`, `priceDelta` |
| `Merchant` | The seller receiving the funds. | `id`, `stripeConnectId`, `stripeOnboardingComplete` |

## 2. State Machines

### `CheckoutForm` State Machine
*   **`idle`**: Default state. User can select variant and quantity.
*   **`loading`**: User clicked "Buy Now". Button shows spinner while server creates Stripe Checkout Session.
*   **`redirecting`**: Session created successfully. Redirecting user to Stripe's hosted checkout page.
*   **`error`**: Failed to create session (e.g., merchant unconnected). Displays friendly error message.

## 3. Gherkin Scenarios

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

## 4. Component Specifications

| Component | Type | Props | State | Events | Visual Rules & Design System Tokens |
|---|---|---|---|---|---|
| `CheckoutForm` | Client | `listing`, `variants`, `merchant` | `selectedVariant`, `quantity` (default 1, max 10), `status` (idle, loading, error), `errorMessage` | `onSubmit` -> calls `/api/checkout/create-intent` | **CTA Button:** Primary Button (`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`). Shows spinner in `loading` state. <br/> **Layout:** Variant selector above CTA. <br/> **Error State:** Displays `errorMessage` in `text-rose-700 bg-rose-100` subtle badge/box. |
| `CheckoutConfirmation` | Server/Client | `sessionId` | None | None | **Container:** Standard Card (`bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`). <br/> **Icon:** Check icon (`text-emerald-500`). <br/> **Typography:** H3 for "Payment Successful!" (`font-outfit text-2xl font-semibold text-slate-900 leading-snug`). <br/> **Action:** "Browse More" link uses Secondary Button (`inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`). |