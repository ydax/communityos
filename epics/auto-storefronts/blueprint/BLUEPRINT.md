# BLUEPRINT: Auto-Generated Merchant Storefronts

## Last Updated
2026-05-02

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| `Site` | `id`, `slug`, `theme`, `name`, `bio`, `logoUrl`, `coverPhotoUrl`, `hours`, `location` | The merchant's storefront configuration and profile data. |
| `Listing` | `id`, `siteId`, `type` (enum: product, event, service), `title`, `description`, `imageUrl`, `price`, `eventDate`, `billingModel`, `isActive` | An individual offering displayed on the storefront. |

## 2. State Machines

### `StorefrontTabMachine`
Manages the state of the listing tabs on the storefront.

| State | Event | Next State | Actions/Guards |
|---|---|---|---|
| `INITIALIZING` | `EVALUATE_LISTINGS` | `SINGLE_TYPE` | Guard: Only one listing type exists. Action: Hide tab bar. |
| `INITIALIZING` | `EVALUATE_LISTINGS` | `MULTI_TYPE` | Guard: Multiple listing types exist. Action: Set default active tab to first available type. |
| `MULTI_TYPE` | `SELECT_TAB` | `MULTI_TYPE` | Action: Update `activeTab` state, trigger animated grid transition (fade or slide). |

### `BusinessHoursMachine`
Manages the expandable schedule view for business hours in the profile header.

| State | Event | Next State | Actions/Guards |
|---|---|---|---|
| `COLLAPSED` | `TOGGLE_SCHEDULE` | `EXPANDED` | Action: Reveal full schedule with smooth expand animation. |
| `EXPANDED` | `TOGGLE_SCHEDULE` | `COLLAPSED` | Action: Hide full schedule. |

## 3. Gherkin Scenarios

```gherkin
Feature: Tabbed Listing Display

  Scenario: Listings are grouped by type
    Given a merchant with 3 products, 2 events, and 1 service
    When a consumer visits their storefront
    Then a tab bar shows "Products" (3), "Events" (2), "Services" (1)
    And "Products" is the default selected tab
    And the grid shows only product listings

  Scenario: Switching tabs filters listings
    Given a consumer on a storefront with multiple listing types
    When they click the "Events" tab
    Then the listing grid updates to show only event listings
    And the tab transition is animated (fade or slide)

  Scenario: Single type hides tab bar
    Given a merchant who only has event listings
    When a consumer visits their storefront
    Then the tab bar is not rendered
    And all event listings display directly in the grid

  Scenario: Empty type is excluded from tabs
    Given a merchant with products and services but no events
    When a consumer visits their storefront
    Then only "Products" and "Services" tabs appear
    And there is no "Events" tab

  Scenario: Listing cards adapt to type
    Given an event listing in the grid
    Then the card displays the event date and time prominently
    And a product card displays the price
    And a service card displays the billing model (e.g., "From $75/hr")

Feature: Dynamic Storefront Page

  Scenario: Storefront renders from slug
    Given a merchant with slug "river-city-scapes"
    When a visitor navigates to /m/river-city-scapes
    Then the page renders with the merchant's business name, logo, and bio
    And displays their business hours
    And shows their city location
    And lists their active listings in a grid

  Scenario: Storefront with no listings
    Given a new merchant who has completed their profile but has no listings
    When a visitor navigates to their storefront
    Then the profile header renders correctly
    And the listings section shows an empty state: "Coming soon — check back for offerings!"

  Scenario: Invalid slug returns 404
    Given no merchant exists with slug "fake-business"
    When a visitor navigates to /m/fake-business
    Then the Next.js not-found page renders
    And the response status code is 404

  Scenario: Page is server-side rendered
    Given a merchant with slug "joes-bbq"
    When a search engine bot requests /m/joes-bbq
    Then the full HTML is returned in the initial response (no client-side fetch required)
    And the page uses ISR with revalidate of 60 seconds

Feature: Storefront SEO & OpenGraph

  Scenario: Dynamic meta tags are generated
    Given a merchant "Joe's BBQ" with bio "Best brisket in San Marcos"
    When a search engine indexes /m/joes-bbq
    Then the <title> tag is "Joe's BBQ | CentralTexas.com"
    And the meta description is "Best brisket in San Marcos"
    And og:title is "Joe's BBQ"
    And og:description is "Best brisket in San Marcos"
    And og:url is "https://centraltexas.com/m/joes-bbq"

  Scenario: OpenGraph image uses merchant logo
    Given a merchant with a logoUrl set
    When their storefront link is shared on Instagram
    Then the link preview shows their logo as the og:image

  Scenario: Fallback meta for merchants without a bio
    Given a merchant who left the bio field empty
    Then the meta description defaults to "{Business Name} on CentralTexas.com — your local marketplace"

  Scenario: Canonical URL is set correctly
    Given a merchant storefront at /m/river-city-scapes
    Then the canonical URL meta tag points to https://centraltexas.com/m/river-city-scapes
```

## 4. Component Specifications

| Component | Type | Routing/State | Visual/Design System Rules |
|---|---|---|---|
| `RootLayout` (`app/layout.js`) | Server | Root layout. Defines default meta tags and OpenGraph fallback. | N/A |
| `StorefrontPage` (`app/m/[slug]/page.js`) | Server | Dynamic route `/m/[slug]`. Fetches `Site` via `getSiteBySlug` and `Listing`s via `listListingsBySite`. Returns 404 if slug is invalid. Uses ISR (`revalidate: 60`). Generates dynamic OpenGraph metadata (`title`, `description`, `og:title`, `og:description`, `og:image`, `og:url`, canonical URL) using `generateMetadata`. Uses `logoUrl` for `og:image` with fallback. Provides fallback description if `bio` is empty. Injects JSON-LD LocalBusiness structured data. | N/A (Data fetching and SEO wrapper) |
| `SiteRenderer` (`components/sites/SiteRenderer.js`) | Client | Manages `activeTab` state. Groups listings by `type`. Dispatches to `TheMaker`, `TheTrade`, or `TheVenue` based on `site.theme`. | Renders top section: full-width cover photo with logo overlay, business name, bio, location (city + map link), and business hours (compact badge with expandable schedule). Renders tab bar between profile header and grid. Tab bar uses horizontal scrollable pill bar on mobile, standard on desktop. Active tab: `bg-indigo-50 text-indigo-700 font-medium rounded-full`. Inactive: `text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium rounded-full`. Includes listing count badge. Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`. Shows empty state "Coming soon — check back for offerings!" if no listings. |
| `ListingCard` (`components/listings/ListingCard.js`) | Client | Receives `listing` prop. | Uses Interactive Marketplace Card: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`. Adapts content: prominent date/time for events, price for products, billing model for services. |
| `TheMaker` (`components/sites/themes/TheMaker.js`) | Client | Receives `site` and `filteredListings`. | Earthy, organic vibe. Primary actions use `amber-500`. Max border radiuses (`rounded-full` buttons, `rounded-[2rem]` images). Background `#FAF9F6`. Asymmetrical CSS grids for galleries. |
| `TheTrade` (`components/sites/themes/TheTrade.js`) | Client | Receives `site` and `filteredListings`. | Ironclad trust vibe. Heavy `indigo-600` and `slate-900`. Tight radiuses (`rounded-md` or `rounded-lg`). Highly structured list-views. |
| `TheVenue` (`components/sites/themes/TheVenue.js`) | Client | Receives `site` and `filteredListings`. | Immersive, moody vibe. Dark mode (`bg-slate-900`, `text-white`). Full-bleed layouts (`w-full`). Glassmorphism base (`bg-black/40 backdrop-blur-lg border-white/10`). Sharp corners (`rounded-none`). |
| `sitesService` (`lib/dbServices/sitesService.js`) | Service | N/A | Firestore queries for `Site` entity by `slug` (`getSiteBySlug`). |
| `listingsService` (`lib/dbServices/listingsService.js`) | Service | N/A | Firestore queries for `Listing` entities by `siteId` (`listListingsBySite`). |