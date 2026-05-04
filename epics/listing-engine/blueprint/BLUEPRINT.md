# BLUEPRINT: Universal Listing Engine

**Last Updated:** 2024-05-26

## 1. Epic Context
The Universal Listing Engine provides a single unified form and polymorphic document model for merchants to create and manage listings of any type (Product, Event, Service, Food, Community). All listings share a common base schema for marketplace search, with type-specific extension fields stored in a polymorphic `details` JSON payload.

## 2. Entities & Data Models

| Entity | Type | Description | Fields |
|---|---|---|---|
| `Listing` | Document | Base polymorphic listing schema | `id`, `type` (Enum: PRODUCT, EVENT, SERVICE, FOOD, COMMUNITY), `status` (Enum: active, draft, archived), `title`, `description`, `basePrice` (Int, cents), `images` (Array), `tags` (Array), `location`, `details` (JSON), `variants` (Array) |
| `ProductDetails` | JSON Object | Product-specific details payload stored within `Listing.details` | `fulfillment` (Array), `condition` (String) |
| `EventDetails` | JSON Object | Event-specific details payload stored within `Listing.details` | `startTime` (DateTime), `endTime` (DateTime), `venueName` (String), `isTicketed` (Boolean) |
| `ServiceDetails` | JSON Object | Service-specific details payload stored within `Listing.details` | `estimatedDurationMins` (Int), `requiresQuote` (Boolean), `serviceArea` (String) |
| `FoodDetails` | JSON Object | Food-specific details payload stored within `Listing.details` | `dietaryTags` (Array), `isPreOrder` (Boolean) |
| `CommunityDetails` | JSON Object | Community-specific details payload stored within `Listing.details` | `isFree` (Boolean), `rsvpEnabled` (Boolean) |
| `Variant` | Object | Flat array item for ticket tiers, sizes, etc. | `id` (String), `name` (String), `priceDelta` (Int, cents), `inventoryCount` (Int) |

## 3. State Machines
*(No complex UI state machines defined yet. Component-level derived state handles Event past/upcoming status.)*

**Listing Status Lifecycle:**
- **Draft:** Initial state when a merchant is creating or editing an unpublished listing.
- **Active:** Listing is published and visible on the marketplace.
- **Archived:** Listing is hidden from the marketplace and active dashboard views (triggered via dashboard quick action).

## 4. Gherkin Scenarios

### Feature: Polymorphic Listing Schema

```gherkin
Feature: Polymorphic Listing Schema

  Scenario: Product listing validates correctly
    Given a listing payload with type "PRODUCT"
    And base fields: title, description, basePrice, images, tags
    And details: { fulfillment: ["PICKUP"], condition: "new" }
    When the schema validates the payload
    Then validation succeeds
    And the parsed output includes the details object

  Scenario: Event listing validates with required date fields
    Given a listing payload with type "EVENT"
    And details: { startTime: "2026-06-15T18:00:00Z", endTime: "2026-06-15T22:00:00Z", venueName: "The Pearl", isTicketed: true }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Event listing rejects missing startTime
    Given a listing payload with type "EVENT"
    And details: { venueName: "The Pearl" }
    When the schema validates the payload
    Then validation fails with error on details.startTime

  Scenario: Service listing validates lead-gen fields
    Given a listing payload with type "SERVICE"
    And details: { estimatedDurationMins: 60, requiresQuote: true, serviceArea: "San Marcos" }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Base fields are enforced across all types
    Given a listing payload of any type missing the title field
    When the schema validates the payload
    Then validation fails with error on title

  Scenario: Prices are validated as integer cents
    Given a listing with basePrice: 75.50 (not an integer)
    When the schema validates the payload
    Then validation fails with "Price must be a whole number (in cents)"

  Scenario: Tags are free-form strings
    Given a listing with tags: ["vegan", "live-music", "family-friendly"]
    When the schema validates the payload
    Then validation succeeds
    And tags are preserved as-is

  Scenario: Variants array validates
    Given a listing with variants: [{ name: "VIP", priceDelta: 2500, inventoryCount: 50 }]
    When the schema validates the payload
    Then validation succeeds
    And each variant has an auto-generated id
```

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

### Feature: Merchant Listing Dashboard

```gherkin
Feature: Merchant Listing Dashboard

  Scenario: Dashboard shows all merchant listings
    Given a merchant with 5 active listings of mixed types
    When they navigate to /admin/listings
    Then all 5 listings appear in a grid
    And each card shows the listing type badge, title, price, and status

  Scenario: Filter by listing type
    Given a merchant with products, events, and services
    When they click the "Events" filter pill
    Then only event listings are shown
    And the pill is highlighted as active

  Scenario: Filter by status
    Given a merchant with active and draft listings
    When they select "Drafts" from the status filter
    Then only draft listings are shown

  Scenario: Quick action to edit
    Given a listing card on the dashboard
    When the merchant clicks "Edit"
    Then they are navigated to /admin/listings/{listingId}/edit

  Scenario: Quick action to archive
    Given an active listing on the dashboard
    When the merchant clicks the archive icon
    Then a confirmation prompt appears
    And confirming sets the listing status to "archived"
    And the listing disappears from the active view

  Scenario: Empty state for new merchants
    Given a merchant with no listings
    When they visit /admin/listings
    Then a friendly empty state shows: "No listings yet"
    And a prominent "Create Your First Listing" button is displayed
```

## 5. Component Specifications

| Component | Track | Description | Design System & Tailwind Classes |
|---|---|---|---|
| `ListingCard` | Visual & Behavioral | Renders a polymorphic listing. For `EVENT` types, displays date badge, time, venue, and ticket pricing/RSVP logic. Updated to include type badge and status indicator for dashboard view. | **Base Card:** `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`<br><br>**Type Badge (Top-Left):** `absolute top-4 left-4 bg-indigo-50 text-indigo-700 font-inter text-xs font-bold uppercase tracking-widest rounded-lg px-2 py-1`<br><br>**Status Indicator:** `h-2.5 w-2.5 rounded-full` (Active: `bg-emerald-500`, Draft: `bg-slate-400`, Archived: `bg-rose-500`)<br><br>**Event Date Badge:** `bg-amber-100 text-amber-700 font-inter text-sm font-bold uppercase tracking-widest rounded-lg px-3 py-2`<br><br>**Title:** `font-outfit text-2xl font-semibold text-slate-900 leading-snug`<br><br>**Time/Venue:** `font-inter text-sm font-medium text-slate-600`<br><br>**CTA Button (Active):** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`<br><br>**Past Event State:** Apply `opacity-50` to card. Button uses disabled state: `disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`. |
| `ListingGrid` | Visual & Behavioral | Renders a responsive grid of `ListingCard` components. Handles the empty state when a merchant has no listings. | **Grid Container:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full`<br><br>**Empty State Container:** `flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center`<br><br>**Empty State Text:** `font-inter text-lg font-medium text-slate-600 mb-4` |
| `ListingFilters` | Visual & Behavioral | Provides horizontal scrollable pills for filtering by listing type and a dropdown for filtering by status. Includes a mobile FAB for creating listings. | **Container:** `flex w-full items-center justify-between gap-4 mb-8`<br><br>**Pill List (Scrollable):** `flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar`<br><br>**Filter Pill (Active):** `whitespace-nowrap rounded-full bg-indigo-600 px-4 py-2 font-inter text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out active:scale-[0.98]`<br><br>**Filter Pill (Inactive):** `whitespace-nowrap rounded-full bg-white border border-slate-200 px-4 py-2 font-inter text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]`<br><br>**Status Dropdown:** `rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`<br><br>**Mobile FAB:** `fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all duration-200 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] md:hidden` |