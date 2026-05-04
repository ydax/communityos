# BLUEPRINT: Marketplace Discovery Engine

## Last Updated
2023-10-24

## Entities

| Entity | Description | Fields |
|---|---|---|
| `SearchQuery` | Represents the active filter state and search parameters in the marketplace. | `type` (String: Events, Products, Services), `city` (String[]), `priceMin` (Number), `priceMax` (Number), `dateRange` (String), `tags` (String[]) |
| `FacetCount` | Represents the number of available listings for a specific filter value returned by the search index. | `field` (String), `value` (String), `count` (Number) |

## State Machines

### Filter State Machine
Manages the dynamic filter UI and URL synchronization.
- **States:** `idle`, `updating_filters`, `fetching_results`
- **Events:**
  - `SELECT_CATEGORY`: Changes the primary `type` filter. Swaps available dynamic filters (e.g., shows Date Range for Events, Price Range for Products). Transitions to `updating_filters`.
  - `TOGGLE_FILTER`: Adds or removes a specific facet value (e.g., checking a City). Transitions to `updating_filters`.
  - `REMOVE_CHIP`: Removes an active filter via the chip UI. Transitions to `updating_filters`.
  - `SYNC_URL`: Pushes the new filter state to the URL search parameters. Transitions to `fetching_results`.
  - `RESULTS_LOADED`: Receives new listings and updated `FacetCount` data from the API. Transitions to `idle`.

## Gherkin Scenarios

```gherkin
Feature: Faceted Search

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

## Component Specifications

| Component | Type | Specification |
|---|---|---|
| `ListingFilters` | Visual & Behavioral | **Location:** `components/listings/ListingFilters.js`<br>**Props:** `activeCategory`, `activeFilters`, `facetCounts`, `onChange`<br>**Visual:** Rendered as a collapsible sidebar on desktop (`w-64`) and a bottom sheet on mobile. Container uses `bg-white rounded-2xl border border-slate-200 p-6 shadow-sm`. Headers use `font-inter text-base font-semibold text-slate-800 mb-1.5`. Checkboxes for cities, dual-handle slider for price, and date picker/pre-built options for events. Micro-animations on interaction (`transition-all duration-200 ease-out`).<br>**Behavior:** Dynamically renders filter sections based on `activeCategory`. Emits `onChange` events immediately upon user interaction (no submit button). |
| `FilterChips` | Visual | **Location:** `components/listings/ListingFilters.js` (or sub-component)<br>**Props:** `activeFilters`, `onRemove`<br>**Visual:** Pill-style chips rendered above the results grid. Uses `inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-all duration-200 hover:bg-indigo-100`. Includes a small "×" icon for dismissal.<br>**Behavior:** Clicking the "×" triggers `onRemove` for that specific filter key/value. |
| `Marketplace Page` | Integration | **Location:** `app/marketplace/page.js`<br>**Behavior:** Acts as the orchestrator for the search view. Reads initial state from URL search parameters. Passes state to `ListingFilters`. When filters change, updates the URL using Next.js `useRouter` (`router.push` or `router.replace` with `scroll: false`) to persist state. Fetches data from `/api/marketplace/search` based on active URL parameters. |
| `Search API Route` | API | **Location:** `app/api/marketplace/search/route.js`<br>**Behavior:** Accepts GET requests with query parameters (e.g., `?type=EVENT&city=San+Marcos`). Constructs a query for the external search index (Typesense/Algolia). Applies AND logic across different filter categories. Requests facet counts for `city`, `tags`, etc. Returns a JSON payload containing `listings` (array) and `facets` (array of `FacetCount` objects). |