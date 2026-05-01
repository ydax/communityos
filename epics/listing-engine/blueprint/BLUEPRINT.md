# BLUEPRINT: Universal Listing Engine

## Last Updated
2026-05-02

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Listing` | Polymorphic document representing a merchant's offering. | `id` (string), `merchantId` (string), `type` (enum: PRODUCT, EVENT, SERVICE, FOOD, COMMUNITY), `status` (enum: draft, active, archived), `title` (string), `description` (string), `basePrice` (integer, cents), `images` (array of strings), `tags` (array of strings), `location` (string), `details` (JSON map), `variants` (array of objects) |

## 2. State Machines

### Listing Status Machine
| Current State | Event | Next State | Side Effects |
|---|---|---|---|
| `draft` | `publish` | `active` | Make visible on marketplace |
| `active` | `unpublish` | `draft` | Remove from marketplace |
| `active` | `archive` | `archived` | Hide from active dashboard view |
| `draft` | `archive` | `archived` | Hide from active dashboard view |

## 3. Gherkin Scenarios

### Feature: Merchant Listing Dashboard

```gherkin
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

## 4. Component Specifications

| Component | Track | Specifications |
|---|---|---|
| `AdminListingsPage` | Visual & Behavioral | **Layout:** `max-w-5xl mx-auto p-6 lg:p-10`. Contains `ListingFilters` and `ListingGrid`.<br>**Empty State:** Displays when 0 listings. Text: "No listings yet" (`font-inter text-lg font-normal text-slate-600`). Button: "Create Your First Listing" using Primary Button styles (`inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`). |
| `ListingGrid` | Visual | **Layout:** CSS Grid for cards. `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. |
| `ListingFilters` | Visual & Behavioral | **Type Pills:** Horizontal scrollable container. Inactive pill: Ghost/Tertiary button styles (`inline-flex items-center justify-center rounded-lg bg-transparent px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]`). Active pill: `bg-indigo-50 text-indigo-700`.<br>**Status Dropdown:** Standard select input (`block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20`). |
| `ListingCard` | Visual & Behavioral | **Container:** Interactive Marketplace Card (`group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`).<br>**Type Badge:** Top-left corner. `font-inter text-xs font-semibold tracking-wider uppercase rounded-full px-2 py-1`. Color-coded per type.<br>**Status Indicator:** Dot indicator (Green `bg-emerald-500` for active, Gray `bg-slate-400` for draft, Red `bg-rose-500` for archived).<br>**Typography:** Title uses H4 (`font-inter text-xl font-semibold text-slate-900`). Price uses Body Base (`font-inter text-base font-normal text-slate-600`).<br>**Actions:** Edit button, Archive icon button (with confirmation prompt). |