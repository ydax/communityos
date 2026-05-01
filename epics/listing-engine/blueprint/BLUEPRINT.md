# Blueprint: Universal Listing Engine

Last Updated: 2026-05-01

## Entities

| Entity | Field | Type | Description |
|---|---|---|---|
| Listing | id | string | Unique identifier |
| Listing | type | enum | PRODUCT, EVENT, SERVICE, FOOD, COMMUNITY |
| Listing | title | string | Listing title |
| Listing | description | string | Listing description |
| Listing | basePrice | integer | Base price in cents |
| Listing | details | object | Polymorphic JSON map. For EVENT: `startTime` (datetime), `endTime` (datetime), `venue` (string), `isTicketed` (boolean) |
| Listing | variants | array | Array of variant objects |
| Variant | name | string | Name of the variant (e.g., "VIP") |
| Variant | priceDelta | integer | Price difference from basePrice in cents |
| Variant | inventoryCount | integer | Number of items/tickets available |

## State Machines

### ListingCard State Machine
| State | Description | Transitions |
|---|---|---|
| Upcoming | Event `endTime` is in the future. Normal styling, active CTA. | -> Past (when current time > `endTime`) |
| Past | Event `endTime` is in the past. Reduced opacity, "Past Event" badge, disabled CTA. | None |

## Component Specifications

| Component | Props | State | Events | Visual Rules |
|---|---|---|---|---|
| ListingCard | `listing` (Object) | None (derived from `listing.details.endTime`) | `onCtaClick` | **Container**: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`.<br>**Typography**: Title uses `font-outfit text-2xl font-semibold text-slate-900`. Body uses `font-inter text-slate-600`.<br>**Event Badge**: Amber accent (`bg-amber-500` or `text-amber-500`), bold month abbreviation + day number, left-aligned.<br>**Time**: Human-readable (e.g., "Sat, Jun 15 · 6:00 PM").<br>**Pricing/CTA**: If `isTicketed` is true, show "From $XX" (basePrice + lowest variant priceDelta) and "Buy Tickets" button. If false, show "Free Event" and "RSVP" button.<br>**Past Event**: If `endTime` < now, add "Past Event" badge, reduce card opacity, and disable CTA button (`disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`). |

## Gherkin Scenarios

```gherkin
Feature: Event Listing Type

  Scenario: Event listing displays date prominently
    Given an event listing with startTime "2026-06-15T18:00:00Z"
    When rendered as a ListingCard
    Then the card shows a date badge: "JUN 15" in large text
    And shows the time: "6:00 PM"
    And shows the venue name below the title

  Scenario: Ticketed event has ticket tiers as variants
    Given a ticketed event "Farm Festival"
    When the merchant adds variants:
      | name              | priceDelta | inventoryCount |
      | General Admission | 0          | 200            |
      | VIP               | 2500       | 50             |
    Then the event listing has 2 variants
    And GA ticket price = basePrice + 0
    And VIP ticket price = basePrice + 2500

  Scenario: Free event has no variants
    Given a community event with isTicketed: false
    Then the listing card shows "Free Event" instead of a price
    And the CTA button says "RSVP" instead of "Buy Tickets"

  Scenario: Past events are visually muted
    Given an event with endTime before the current date
    When displayed on the marketplace or storefront
    Then the card shows a "Past Event" badge
    And the card opacity is reduced
    And the "Buy Tickets" button is disabled
```