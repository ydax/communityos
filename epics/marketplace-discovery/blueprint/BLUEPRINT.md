# BLUEPRINT: Marketplace Discovery Engine

## Last Updated
2024-05-22

## Entities

| Entity | Description | Fields |
|---|---|---|
| `SearchQuery` | Represents the active filter state and search parameters in the marketplace. | `query` (String), `type` (String: Events, Products, Services, Food, Community), `city` (String[]), `priceMin` (Number), `priceMax` (Number), `dateRange` (String), `tags` (String[]) |
| `FacetCount` | Represents the number of available listings for a specific filter value returned by the search index. | `field` (String), `value` (String), `count` (Number) |
| `Listing` | Represents the full data model of a marketplace listing fetched from Firestore for the detail page. | `id` (String), `type` (String: Product, Event, Service, Food, Community), `title` (String), `description` (String), `images` (String[]), `price` (Number/String), `merchant` (Object: name, logo, slug), `variants` (Array), `eventDetails` (Object: date, venue, ticketTiers) |

## State Machines

### Filter State Machine
Manages the dynamic filter UI and URL synchronization.
- **States:** `idle`, `updating_filters`, `fetching_results`
- **Events:**
  - `SUBMIT_SEARCH`: Updates the global text search query. Transitions to `updating_filters`.
  - `SELECT_CATEGORY`: Changes the primary `type` filter. Swaps available dynamic filters (e.g., shows Date Range for Events, Price Range for Products). Transitions to `updating_filters`.
  - `TOGGLE_FILTER`: Adds or removes a specific facet value (e.g., checking a City). Transitions to `updating_filters`.
  - `REMOVE_CHIP`: Removes an active filter via the chip UI. Transitions to `updating_filters`.
  - `SYNC_URL`: Pushes the new filter state to the URL search parameters. Transitions to `fetching_results`.
  - `RESULTS_LOADED`: Receives new listings and updated `FacetCount` data from the API. Transitions to `idle`.

### Image Gallery State Machine
Manages the active image viewing state on the listing detail page.
- **States:** `idle`, `viewing_image`
- **Events:**
  - `SELECT_THUMBNAIL`: Updates the main display image to the selected thumbnail. Transitions to `viewing_image`.
  - `SCROLL_GALLERY`: Updates the active index based on horizontal scroll position (mobile).

### Variant Selector State Machine
Manages the selected product variant on the listing detail page.
- **States:** `idle`, `variant_selected`
- **Events:**
  - `SELECT_VARIANT`: Updates the selected variant, adjusting the displayed price and available stock. Transitions to `variant_selected`.

## Gherkin Scenarios

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

Feature: Listing Detail Page

  Scenario: Product detail page renders correctly
    Given a PRODUCT listing "Handmade Candle" with 3 images and 2 variants
    When a consumer navigates to /marketplace/{listingId}
    Then the page shows an image gallery with 3 images
    And the title, description, and base price
    And a variant selector dropdown
    And a "Buy Now" button
    And a merchant info card with name, logo, and link to storefront

  Scenario: Event detail page shows date and tickets
    Given an EVENT listing "Farm Festival" on June 15
    When a consumer views the detail page
    Then the page prominently displays "Saturday, June 15, 2026 · 6:00 PM"
    And shows the venue name and address
    And lists ticket tiers with prices
    And a "Get Tickets" CTA button

  Scenario: Service detail page shows lead-gen CTA
    Given a SERVICE listing "Residential Plumbing"
    When a consumer views the detail page
    Then the pricing shows "From $75/hr" or "Request a Quote"
    And the CTA button says "Request Quote" or "Contact"

  Scenario: Merchant card links to storefront
    Given a listing by merchant "River City Scapes" with slug "river-city-scapes"
    When the consumer clicks the merchant name
    Then they navigate to /m/river-city-scapes

  Scenario: OpenGraph meta tags for sharing
    Given a listing "Farm Festival" with an image
    When the page URL is shared on social media
    Then the link preview shows the listing title, image, and price

  Scenario: 404 for invalid listing ID
    Given no listing exists with ID "nonexistent123"
    When a consumer navigates to /marketplace/nonexistent123
    Then the 404 page renders
```

## Component Specifications

| Component | Type | Specification |
|---|---|---|
| `Marketplace Page` | Integration | **Location:** `app/marketplace/page.js`<br>**Behavior:** Acts as the orchestrator for the search view. Reads initial state from URL search parameters. Passes state to `ListingFilters`, `HeroSearchBar`, and `CategoryPills`. When filters change, updates the URL using Next.js `useRouter` (`router.push` or `router.replace` with `scroll: false`) to persist state. Fetches data from `/api/marketplace/search` based on active URL parameters.<br>**Visual:** Renders a hero section with a full-width gradient background, a "Happening This Weekend" carousel, and a results grid (1-col mobile, 2-col tablet, 3-col desktop). Displays `MarketplaceSkeleton` while loading and `EmptySearchState` if no results. |
| `HeroSearchBar` | Visual & Behavioral | **Location:** `components/listings/HeroSearchBar.js`<br>**Props:** `initialQuery`, `onSearch`<br>**Visual:** Large centered search input using glassmorphic style: `bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm supports-[backdrop-filter]:bg-white/60`.<br>**Behavior:** Captures text input and triggers `onSearch` when the user presses Enter. |
| `CategoryPills` | Visual & Behavioral | **Location:** `components/listings/CategoryPills.js`<br>**Props:** `categories`, `activeCategory`, `onSelect`<br>**Visual:** Horizontal scroll on mobile, centered row on desktop. Active pill is highlighted (e.g., using `bg-indigo-600 text-white`), inactive pills use standard secondary/ghost button styling.<br>**Behavior:** Clicking a pill triggers `onSelect` to filter by category. |
| `ListingCarousel` | Visual | **Location:** `components/listings/ListingCarousel.js`<br>**Props:** `listings`<br>**Visual:** Horizontal scroll card carousel with snap points.<br>**Behavior:** Allows users to swipe through featured listings (e.g., "Happening This Weekend"). |
| `ListingFilters` | Visual & Behavioral | **Location:** `components/listings/ListingFilters.js`<br>**Props:** `activeCategory`, `activeFilters`, `facetCounts`, `onChange`<br>**Visual:** Rendered as a collapsible sidebar on desktop (`w-64`) and a bottom sheet on mobile. Container uses `bg-white rounded-2xl border border-slate-200 p-6 shadow-sm`. Headers use `font-inter text-base font-semibold text-slate-800 mb-1.5`. Checkboxes for cities, dual-handle slider for price, and date picker/pre-built options for events. Micro-animations on interaction (`transition-all duration-200 ease-out`).<br>**Behavior:** Dynamically renders filter sections based on `activeCategory`. Emits `onChange` events immediately upon user interaction (no submit button). |
| `FilterChips` | Visual | **Location:** `components/listings/ListingFilters.js` (or sub-component)<br>**Props:** `activeFilters`, `onRemove`<br>**Visual:** Pill-style chips rendered above the results grid. Uses `inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-all duration-200 hover:bg-indigo-100`. Includes a small "×" icon for dismissal.<br>**Behavior:** Clicking the "×" triggers `onRemove` for that specific filter key/value. |
| `Search API Route` | API | **Location:** `app/api/marketplace/search/route.js`<br>**Behavior:** Accepts GET requests with query parameters (e.g., `?q=yoga&type=EVENT&city=San+Marcos`). Constructs a query for the external search index (Typesense/Algolia). Applies full-text search on the `q` parameter, AND logic across different filter categories, and geo-bounding (e.g., within 25 miles of `preferredCity`). Requests facet counts for `city`, `tags`, etc. Returns a JSON payload containing `listings` (array with highlighted search terms) and `facets` (array of `FacetCount` objects). |
| `Listing Detail Page` | Integration | **Location:** `app/marketplace/[listingId]/page.js`<br>**Behavior:** Server-side component. Fetches listing data directly from Firestore via `getListingById`. Returns 404 if listing doesn't exist. Generates OpenGraph meta tags for social sharing. Adapts layout and child components based on listing `type` (Product, Event, Service, Food, Community). Includes a breadcrumb (Marketplace > {Type} > {Listing Title}). Price display uses large, bold text (`font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`). |
| `Merchant Info Card` | Visual | **Location:** `components/listings/MerchantCard.js` (or inline)<br>**Props:** `merchant` (name, logo, slug)<br>**Visual:** Uses Standard Card styling: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Displays merchant logo, name (`font-inter text-base font-semibold text-slate-800`), and a "Visit Storefront →" link.<br>**Behavior:** Clicking the card or link navigates to `/m/[slug]`. |
| `Listing Image Gallery` | Visual & Behavioral | **Location:** `components/listings/ImageGallery.js`<br>**Props:** `images` (Array of URLs)<br>**Visual:** Horizontal scroll with snap points on mobile. Main hero image with a grid of thumbnails below on desktop. Images use `rounded-2xl` to match the design system's standard card radius.<br>**Behavior:** Clicking a thumbnail updates the main hero image. |
| `Listing CTA Button` | Visual | **Location:** `components/listings/ListingCTA.js`<br>**Props:** `type`, `label`, `onClick`<br>**Visual:** Uses Primary Button tokens: `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. Full-width (`w-full`) on mobile, inline on desktop.<br>**Behavior:** Triggers purchase, ticket modal, or contact form based on listing type. |
| `ListingCard` | Visual & Behavioral | **Location:** `components/listings/ListingCard.js`<br>**Behavior:** Updated to ensure the card links correctly to `/marketplace/[listingId]`.<br>**Visual:** Uses Interactive Marketplace Card tokens: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`. Search terms are highlighted in the results if applicable. |
| `EmptySearchState` | Visual | **Location:** `components/listings/EmptySearchState.js`<br>**Props:** `query`<br>**Visual:** Centered layout with a friendly message and suggestions. Uses `font-outfit` for the main message and `font-inter` for suggestions.<br>**Behavior:** Renders when the search results array is empty. |
| `MarketplaceSkeleton` | Visual | **Location:** `components/listings/MarketplaceSkeleton.js`<br>**Visual:** Premium shimmer skeleton using `animate-pulse rounded-2xl bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-50 bg-[length:200%_100%]`. |
