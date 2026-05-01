# BLUEPRINT.md

**Last Updated:** 2023-10-26

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `ListingIndexDocument` | Flattened listing data stored in the external search index (Typesense/Algolia). | `id` (string), `title` (string), `description` (string), `type` (enum: EVENT, PRODUCT, SERVICE, FOOD, COMMUNITY), `category` (string), `merchantName` (string), `city` (string), `lat` (float), `lng` (float), `price` (float), `date` (timestamp) |
| `SearchRequest` | Payload sent from the client to the search API. | `query` (string), `category` (string), `preferredCity` (string), `radius` (number), `page` (number), `limit` (number) |
| `SearchResponse` | Response returned by the search API. | `hits` (array of ListingIndexDocument), `facetCounts` (object), `total` (number), `page` (number) |

## 2. State Machines

### MarketplaceSearchState

Manages the state of the marketplace search and filtering interface.

| State | Event | Next State | Actions |
|---|---|---|---|
| `IDLE` | `INITIATE_SEARCH` | `LOADING` | Set search query/category, show premium shimmer skeleton. |
| `LOADING` | `FETCH_SUCCESS` | `POPULATED` | Render results grid or carousel, update facet counts. |
| `LOADING` | `FETCH_EMPTY` | `EMPTY` | Display friendly empty state message. |
| `LOADING` | `FETCH_ERROR` | `ERROR` | Display error message, allow retry. |
| `POPULATED` | `UPDATE_FILTER` | `LOADING` | Update category pill or search term, re-fetch. |
| `EMPTY` | `UPDATE_FILTER` | `LOADING` | Update category pill or search term, re-fetch. |
| `ERROR` | `RETRY` | `LOADING` | Re-attempt fetch with current parameters. |

## 3. Gherkin Scenarios

```gherkin
Feature: Marketplace Homepage

  Scenario: Homepage loads with default listings
    Given a consumer visits centraltexas.com/marketplace
    Then the page shows a hero search bar
    And category pills: Events, Products, Services, Food, Community
    And a "Happening This Weekend" section with upcoming events
    And a "Recently Added" grid of the newest listings

  Scenario: Search returns relevant results
    Given listings exist for "BBQ", "plumbing", and "yoga"
    When a consumer types "yoga" in the search bar and presses Enter
    Then the results show only yoga-related listings
    And search terms are highlighted in the results

  Scenario: Category pill filters results
    Given a consumer on the marketplace homepage
    When they click the "Events" category pill
    Then only EVENT-type listings are displayed
    And the pill is highlighted as active
    And other pills are deselected

  Scenario: Results are geo-bounded
    Given a consumer with preferredCity "San Marcos"
    When they search for "plumbing"
    Then results within 25 miles of San Marcos appear first
    And distant results appear lower or are excluded

  Scenario: Empty search shows helpful state
    Given no listings match the query "underwater basket weaving"
    When the search results are empty
    Then a friendly message appears: "No results for 'underwater basket weaving'"
    And suggests: "Try a broader search or browse categories"
```

## 4. Component Specifications

| Component | Type | Description | Design System & Styling Notes |
|---|---|---|---|
| `app/marketplace/page.js` | Page | The primary consumer landing page for the marketplace. Contains the Hero Search, Category Pills, "Happening This Weekend" carousel, and "Recently Added" grid. | Uses `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Hero section has a full-width gradient background. Results grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with `gap-8`. Loading states must use the premium shimmer skeleton: `animate-pulse rounded-2xl bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-50 bg-[length:200%_100%]`. |
| `app/api/marketplace/search/route.js` | API Route | Handles search requests, querying the external search index (Typesense/Algolia). Applies facets, full-text search, and geo-bounding based on `preferredCity`. | Returns JSON `SearchResponse`. Limits results to 50 per request. Handles empty states and errors gracefully. |
| `components/listings/ListingCard.js` | UI Component | Displays individual listing data (title, merchant, location, type). | Must use the Interactive Marketplace Card style: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`. Active state: `active:scale-[0.98]`. |
| `components/marketplace/HeroSearch.js` | UI Component | Large centered search input in the hero section. | Input uses glassmorphic style: `bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm supports-[backdrop-filter]:bg-white/60`. Typography: `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight` for the hero heading. |
| `components/marketplace/CategoryPills.js` | UI Component | Selectable pills for filtering by category (Events, Products, Services, Food, Community). | Horizontal scroll on mobile, centered row on desktop. Active pill uses Civic Indigo (`bg-indigo-600 text-white`), inactive uses Ghost/Tertiary button styles (`bg-transparent text-slate-600 hover:bg-slate-100`). `rounded-full` for pill shape. |
