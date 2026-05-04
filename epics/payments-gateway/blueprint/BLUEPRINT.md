# BLUEPRINT.md

**Last Updated:** 2026-05-05

## Epic Context: Payments Gateway (Stripe Connect)
Enable commerce without holding the bag. CentralTexas.com is a marketplace, not a merchant. The platform facilitates transactions between consumers and merchants using Stripe Connect Express. For MVP, checkout is single-item, single-merchant only.

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Order` | Represents a consumer's purchase of a listing/variant. | `id`, `listingId`, `variantId`, `consumerId`, `buyerEmail`, `merchantId`, `stripeSessionId`, `stripePaymentIntentId`, `amount`, `platformFee`, `status` (pending, completed, failed, refunded), `createdAt` |
| `Site` | Represents a merchant's tenant configuration and platform settings. | `id`, `merchantId`, `stripeConnectAccountId` (optional), `platformFeePercent` (optional) |
| `Variant` | Represents a specific purchasable option of a listing. | `id`, `listingId`, `name`, `priceDelta`, `inventoryCount` |

## 2. State Machines

### CheckoutForm State
- **Idle**: Default state. Displays "Buy Now" or "Get Tickets" button.
- **Loading**: User clicked CTA. Button shows spinner, disabled.
- **Redirecting**: API returned Stripe Checkout URL. Navigating user to Stripe hosted checkout.
- **Error**: API returned an error (e.g., unconnected merchant). Displays friendly error message, returns to Idle.

### StripeConnectStatus State (Settings Page)
- **Unconnected**: Default state. Displays "Connect Bank Account" button.
- **Incomplete**: Merchant abandoned onboarding. Displays "Payments Setup Incomplete" and "Resume Setup" button.
- **Connected**: Merchant completed onboarding and `charges_enabled` is true. Displays "Payments Connected ✓" with a green badge.

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

### Feature: Order Document & Confirmation

```gherkin
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

### Feature: Stripe Connect Express Onboarding

```gherkin
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

### Feature: Stripe Webhook Handler

```gherkin
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

## 4. Component Specifications

| Component / Service | Type | Description / Behavior | Visual / Design System Tokens |
|---|---|---|---|
| `CheckoutForm` | UI Component | **Props:** `listing`, `variant` (optional), `merchantStripeConnected` (boolean).<br>**State:** `isLoading`, `error`, `quantity` (default 1, max 10).<br>**Behavior:** If `merchantStripeConnected` is false, CTA says "Contact Seller" and opens a contact form. If `listing.externalUrl` exists, open in new tab. Else, call `/api/checkout/create-intent`. On success, redirect to Stripe URL. On error, display message. | **Button:** Primary Button (`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`).<br>**Loading:** Spinner inside button.<br>**Error:** Text `text-rose-700 bg-rose-100 p-4 rounded-lg`. |
| `CheckoutConfirmationPage` | UI Page | **Path:** `/marketplace/checkout`<br>**Props:** `searchParams.session_id`.<br>**Behavior:** Fetches order details using `session_id`. Displays success message, order summary (title, quantity, amount), and "Browse More" link. | **Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.<br>**Card:** Standard Card (`bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`).<br>**Header:** `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`.<br>**Text:** `font-inter text-base font-normal text-slate-600`. |
| `app/api/checkout/create-intent/route.js` | API Route | **Method:** POST.<br>**Payload:** `listingId`, `variantId`, `quantity`.<br>**Behavior:** Validates merchant Stripe Connect status. Calculates total price and 6% platform fee. Creates Stripe Checkout Session with `payment_intent_data.transfer_data.destination` and `application_fee_amount`. Returns `{ url: session.url }`. Returns 400 if merchant unconnected. | N/A |
| `app/admin/orders/page.js` | UI Page | **Path:** `/admin/orders`<br>**Behavior:** Fetches orders for the logged-in merchant via `ordersService`. Displays a table (desktop) or cards (mobile) of orders sorted by date. Columns: Date (relative), Buyer Email, Listing Title (links to edit page), Amount, Status. Displays empty state if 0 orders. | **Container:** `max-w-5xl mx-auto`.<br>**Card/Table Wrapper:** `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden`.<br>**Header:** `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`.<br>**Table Headers:** `font-inter text-xs font-semibold tracking-wider text-slate-500 uppercase`.<br>**Badges:** Completed (`bg-emerald-100 text-emerald-700`), Pending (`bg-amber-100 text-amber-700`), Refunded (`bg-rose-100 text-rose-700`) with `font-inter text-sm font-medium rounded-full px-2.5 py-0.5`.<br>**Empty State Text:** `font-inter text-base font-normal text-slate-600`. |
| `lib/dbServices/ordersService.js` | Service | **Behavior:** Provides functions to create an order document in Firestore (called by webhook handler) and fetch orders by `merchantId` (called by `/admin/orders` page). Handles idempotency by checking if an order with the given `stripeSessionId` already exists before creation. | N/A |
| `app/admin/settings/payments/page.js` | UI Page | **Path:** `/admin/settings/payments`<br>**Behavior:** Fetches merchant's site document. Displays Stripe Connect status. If unconnected, shows "Connect Bank Account" button. If incomplete, shows "Resume Setup". If connected, shows "Payments Connected ✓" with masked bank info. | **Card:** Standard Card (`bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`).<br>**Primary Button:** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`).<br>**Success Badge:** `bg-emerald-100 text-emerald-700 font-inter text-sm font-medium rounded-full px-2.5 py-0.5`.<br>**Warning Badge:** `bg-amber-100 text-amber-700 font-inter text-sm font-medium rounded-full px-2.5 py-0.5`. |
| `app/api/stripe/connect/route.js` | API Route | **Method:** GET/POST.<br>**Behavior:** Creates Stripe Account Link for onboarding. Handles return URL by calling `stripe.accounts.retrieve(accountId)` to verify `charges_enabled` is true before marking merchant as payment-ready in the database. | N/A |
| `lib/dbServices/sitesService.js` | Service | **Behavior:** Provides functions to fetch and update the site document, specifically adding or updating the `stripeConnectAccountId` field. | N/A |
| `app/api/stripe/webhooks/route.js` | API Route | **Method:** POST.<br>**Behavior:** Receives signed events from Stripe. Uses raw body parsing and `STRIPE_WEBHOOK_SECRET` to verify signature via `stripe.webhooks.constructEvent()`. On `checkout.session.completed`, creates order via `ordersService` (idempotent) and decrements variant `inventoryCount` via `inventoryService`. On `checkout.session.expired`, releases pending inventory holds. Returns 200 on success/duplicate, 400 on invalid signature. | N/A |
| `lib/dbServices/inventoryService.js` | Service | **Behavior:** Provides functions to manage variant inventory. Includes atomic decrement of `inventoryCount` using Firestore transactions upon purchase, and releasing pending inventory holds for expired sessions. | N/A |