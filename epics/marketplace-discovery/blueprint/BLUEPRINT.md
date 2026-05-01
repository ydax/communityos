# BLUEPRINT.md

**Last Updated:** 2026-05-01

## Epic Overview: Marketplace Discovery Engine
The marketplace discovery layer provides a fast, faceted, full-text, and geo-bounded search experience for consumers. It utilizes an external search index (Typesense) synced via Firebase Cloud Functions to ensure sub-500ms response times. The architecture relies on flattening listing data upon indexing to avoid cross-collection joins during queries.

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `SearchIndexListing` | Denormalized listing document stored in the external search index (Typesense). | `id` (string), `type` (string), `category` (string), `city` (string), `price` (number), `date` (timestamp), `tags` (array), `merchantName` (string), `geoloc` (lat/lng) |
| `FilterState` | Represents the active filters applied by the user in the UI and URL. | `type` (string), `city` (array), `priceMin` (number), `priceMax` (number), `dateRange` (string), `tags` (array) |
| `SearchFacet` | Represents a facet count returned from the search API to populate filter UI. | `field` (string), `value` (string), `count` (number) |

## 2. State Machines

### ListingFilters State Machine
Manages the state of the dynamic faceted search filters and URL synchronization.

| Current State | Event | Next State | Actions |
|---|---|---|---|
| `idle` | `FILTER_SELECTED` | `updating` | Update local filter state, append/modify URL search params. |
| `idle` | `FILTER_REMOVED` | `updating` | Remove specific filter from local state, update URL search params. |
| `idle` | `CLEAR_ALL` | `updating` | Reset local filter state, strip filter params from URL. |
| `updating` | `SEARCH_SUCCESS` | `idle` | Render new listing results, update dynamic facet counts in UI. |
| `updating` | `SEARCH_ERROR` | `idle` | Display error state/toast, revert to previous filter state. |

## 3. Gherkin Scenarios

### Feature: Faceted Search

```gherkin
  Scenario: Type-specific filters appear dynamically
    Given a consumer selects the "Events" category
    Then a "Date Range" filter appears (This Weekend, This Month, Custom)
    And a "City" filter appears with counts
    And the "Price Range" filter is hidden (events show ticket price in card)

  Scenario: Product filters include price range
    Given a consumer selects the "Products" category
    Then a "Price Range" slider appears (min $0, max $500)
    And a "City" filter appears
    And a "Tags" filter shows popular product tags with counts

  Scenario: Facet counts update with active filters
    Given 50 events across 3 cities
    When the consumer selects "San Marcos"
    Then the facet count for "San Marcos" shows the matching number
    And other city counts update to reflect the narrowed set

  Scenario: Multiple filters are combined with AND logic
    Given a consumer selects type "Events" AND city "Kyle"
    Then only events in Kyle are shown
    And clearing the city filter restores all events

  Scenario: Active filters are shown as removable chips
    Given a consumer with active filters: type "Events", city "San Marcos"
    Then two filter chips appear above the results
    And clicking the "×" on "San Marcos" removes that filter
    And results update immediately

  Scenario: Filter state persists in URL
    Given a consumer filters by type "Events" and city "San Marcos"
    Then the URL updates to /marketplace?type=EVENT&city=San+Marcos
    And sharing that URL shows the same filtered results
```

## 4. Component Specifications

| Component | Type | Description & Design System Tokens |
|---|---|---|
| `components/listings/ListingFilters.js` | Visual & Behavioral | **Behavior:** Renders dynamic filter inputs based on the selected `type` (Events vs. Products). Displays facet counts next to options. Syncs state with URL query parameters. <br>**Visual:** Collapsible sidebar on desktop, bottom sheet on mobile. Uses standard card styling: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] p-6`. Typography uses `font-inter text-sm font-medium text-slate-700` for labels. |
| `components/listings/FilterChip.js` | Visual | **Behavior:** Displays an active filter with a dismiss action ("×") that triggers a `FILTER_REMOVED` event. <br>**Visual:** Pill-style chip using Civic Indigo subtle background: `inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-3 py-1 font-inter text-sm font-medium transition-colors hover:bg-indigo-100`. |
| `components/listings/PriceRangeSlider.js` | Visual & Behavioral | **Behavior:** Dual-handle slider with numeric inputs for min/max price. Only renders when `type === 'Products'`. <br>**Visual:** Inputs use standard form tokens: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20`. |
| `app/api/marketplace/search/route.js` | Behavioral | **Behavior:** Next.js API route. Accepts GET requests with query parameters (type, city, priceMin, priceMax, dateRange, tags). Translates these into a Typesense search query with faceted aggregations. Returns matching listings and facet counts. Implements AND logic for multiple filters. |
| `app/marketplace/page.js` | Visual & Behavioral | **Behavior:** Server Component that reads URL search parameters, passes them to the search API (or client components), and renders the layout containing `ListingFilters` and the results grid. <br>**Visual:** Uses the public marketplace canvas: `bg-slate-50`. Container constrained by `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. |