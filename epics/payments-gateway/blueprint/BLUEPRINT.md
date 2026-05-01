# BLUEPRINT.md

**Last Updated:** 2023-10-24

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| **Order** | `id`, `buyerEmail`, `listingId`, `variantId`, `amount`, `platformFee`, `stripePaymentIntentId`, `status`, `createdAt` | Record of a completed purchase created via Stripe webhook. |

## 2. State Machines

| State Machine | States | Transitions |
|---|---|---|
| **Order Status** | `pending`, `completed`, `refunded` | `pending` -> `completed` (on successful webhook), `completed` -> `refunded` (via Stripe dashboard action) |

## 3. Gherkin Scenarios

### Feature: Order Document & Confirmation

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

## 4. Component Specifications

| Component | Track | Location | Props/State | Design System / Tailwind |
|---|---|---|---|---|
| `AdminOrdersPage` | visual_and_behavioral | `app/admin/orders/page.js` | State: `orders` (Array), `loading` (Boolean) | Dashboard SaaS Canvas (`bg-slate-100`). Main Content container: `max-w-5xl mx-auto p-6 lg:p-10`. Page Title: `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight`. |
| `OrdersTable` | visual_and_behavioral | `components/admin/OrdersTable.js` | Props: `orders` (Array) | Standard Card: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Table headers: `font-inter text-xs font-semibold tracking-wider text-slate-500 uppercase`. Rows: `font-inter text-sm text-slate-600`. Mobile: Stacked cards instead of table rows. |
| `OrderStatusBadge` | visual | `components/admin/OrderStatusBadge.js` | Props: `status` (String) | `font-inter text-sm font-medium leading-none rounded-full px-2.5 py-1`. Success (Completed): `bg-emerald-100 text-emerald-700`. Warning (Pending): `bg-amber-100 text-amber-700`. Error (Refunded): `bg-rose-100 text-rose-700`. |
| `EmptyOrdersState` | visual | `components/admin/EmptyOrdersState.js` | None | Centered layout inside Standard Card. Title: `font-outfit text-2xl font-semibold text-slate-900`. Description: `font-inter text-base text-slate-600`. |