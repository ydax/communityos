# BLUEPRINT: Universal Listing Engine

**Last Updated:** 2023-10-25

## 1. Epic Context
The Universal Listing Engine provides a single unified form and polymorphic document model for merchants to create and manage listings of any type (Product, Event, Service, Food, Community). All listings share a common base schema for marketplace search, with type-specific extension fields stored in a polymorphic `details` JSON payload.

## 2. Entities & Data Models

| Entity | Type | Description | Fields |
|---|---|---|---|
| `Listing` | Document | Base polymorphic listing schema | `id`, `type` (Enum), `title`, `description`, `basePrice` (Int, cents), `images` (Array), `tags` (Array), `location`, `details` (JSON), `variants` (Array) |
| `EventDetails` | JSON Object | Event-specific details payload stored within `Listing.details` | `startTime` (DateTime), `endTime` (DateTime), `venue` (String), `isTicketed` (Boolean) |
| `Variant` | Object | Flat array item for ticket tiers, sizes, etc. | `name` (String), `priceDelta` (Int, cents), `inventoryCount` (Int) |

## 3. State Machines
*(No complex UI state machines defined yet. Component-level derived state handles Event past/upcoming status.)*

## 4. Gherkin Scenarios

### Feature: Event Listing Type

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

## 5. Component Specifications

| Component | Track | Description | Design System & Tailwind Classes |
|---|---|---|---|
| `ListingCard` | Visual & Behavioral | Renders a polymorphic listing. For `EVENT` types, displays date badge, time, venue, and ticket pricing/RSVP logic. | **Base Card:** `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`<br><br>**Event Date Badge:** `bg-amber-100 text-amber-700 font-inter text-sm font-bold uppercase tracking-widest rounded-lg px-3 py-2`<br><br>**Title:** `font-outfit text-2xl font-semibold text-slate-900 leading-snug`<br><br>**Time/Venue:** `font-inter text-sm font-medium text-slate-600`<br><br>**CTA Button (Active):** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`<br><br>**Past Event State:** Apply `opacity-50` to card. Button uses disabled state: `disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`. |