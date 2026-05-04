# BLUEPRINT.md

**Last Updated:** 2026-05-02

## Epic Context: Payments Gateway (Stripe Connect)
Enable commerce without holding the bag. CentralTexas.com is a marketplace, not a merchant. The platform facilitates transactions between consumers and merchants using Stripe Connect Express. For MVP, checkout is single-item, single-merchant only.

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Order` | Represents a consumer's purchase of a listing/variant. | `id`, `listingId`, `variantId`, `consumerId`, `merchantId`, `stripeSessionId`, `totalAmount`, `platformFee`, `status` (pending, paid, failed), `createdAt` |

## 2. State Machines

### CheckoutForm State
- **Idle**: Default state. Displays "Buy Now" or "Get Tickets" button.
- **Loading**: User clicked CTA. Button shows spinner, disabled.
- **Redirecting**: API returned Stripe Checkout URL. Navigating user to Stripe hosted checkout.
- **Error**: API returned an error (e.g., unconnected merchant). Displays friendly error message, returns to Idle.

## 3. Gherkin Scenarios

### Feature: Single-Item Checkout

```gherkin
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

| Component / Service | Type | Description / Behavior | Visual / Design System Tokens |
|---|---|---|---|
| `CheckoutForm` | UI Component | **Props:** `listing`, `variant` (optional).<br>**State:** `isLoading`, `error`, `quantity` (default 1, max 10).<br>**Behavior:** On click, if `listing.externalUrl` exists, open in new tab. Else, call `/api/checkout/create-intent`. On success, redirect to Stripe URL. On error, display message. | **Button:** Primary Button (`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`).<br>**Loading:** Spinner inside button.<br>**Error:** Text `text-rose-700 bg-rose-100 p-4 rounded-lg`. |
| `CheckoutConfirmationPage` | UI Page | **Path:** `/marketplace/checkout`<br>**Props:** `searchParams.session_id`.<br>**Behavior:** Fetches order details using `session_id`. Displays success message, order summary (title, quantity, amount), and "Browse More" link. | **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.<br>**Card:** Standard Card (`bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`).<br>**Header:** `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`.<br>**Text:** `font-inter text-base font-normal text-slate-600`. |
| `app/api/checkout/create-intent/route.js` | API Route | **Method:** POST.<br>**Payload:** `listingId`, `variantId`, `quantity`.<br>**Behavior:** Validates merchant Stripe Connect status. Calculates total price and 6% platform fee. Creates Stripe Checkout Session with `payment_intent_data.transfer_data.destination` and `application_fee_amount`. Returns `{ url: session.url }`. Returns 400 if merchant unconnected. | N/A |
