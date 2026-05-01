# BLUEPRINT: CentralTexas.com

**Last Updated:** 2024-05-24

## 1. System Architecture

### 1.1 Entities
| Entity | Description | Key Fields |
|---|---|---|
| **Order** | Record of a completed purchase via Stripe Checkout | `id`, `stripeSessionId`, `listingId`, `variantId`, `quantity`, `status`, `createdAt` |
| **Variant** | A purchasable item option with trackable inventory | `id`, `inventoryCount`, `price` |

### 1.2 State Machines
| State Machine | States | Transitions |
|---|---|---|
| **Order Status** | `pending`, `paid`, `expired` | `pending` -> `paid` (on `checkout.session.completed`)<br>`pending` -> `expired` (on `checkout.session.expired`) |

---

## 2. Behavioral Specifications

### Feature: Stripe Webhook Handler

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

---

## 3. Component Specifications

| Component | Description | Props/State | Design System Tokens |
|---|---|---|---|
| *(No visual components defined yet)* | | | |
