# BLUEPRINT: Auto-Generated Merchant Storefronts

**Last Updated:** 2024-05-24

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Site` | Merchant storefront configuration and profile | `id`, `slug`, `name`, `logoUrl`, `bio`, `hours`, `city`, `theme` |
| `Listing` | An offering by the merchant (Shop, Events, Services) | `id`, `siteId`, `title`, `type`, `status`, `imageUrl`, `price` |

## 2. State Machines

| State Machine | States | Events | Transitions |
|---|---|---|---|
| `ListingTabs` | `SHOP`, `EVENTS`, `SERVICES` | `SELECT_TAB` | `SHOP` -> `SELECT_TAB(EVENTS)` -> `EVENTS`, etc. |

## 3. Gherkin Scenarios

```gherkin
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
```

## 4. Component Specifications

| Component | Type | Data/Props | Styling/Design System Tokens |
|---|---|---|---|
| `app/m/[slug]/page.js` | Server | `params.slug` | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (Public Marketplace Hub container). Uses ISR (`revalidate: 60`). |
| `SiteRenderer` | Server | `site`, `listings` | Dispatches to theme components (`TheMaker`, `TheTrade`, `TheVenue`). |
| `StorefrontHeader` | Server | `site` | Hero section uses full-width cover photo with logo overlay. H1: `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight`. |
| `ListingTabs` | Client | `listings`, `activeTab` | Secondary Button style for tabs: `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. |
| `ListingGrid` | Server | `listings` | Mobile: single-column stack (`grid-cols-1`), Desktop: 2-3 column grid (`md:grid-cols-2 lg:grid-cols-3`). `gap-8`. |
| `ListingCard` | Client | `listing` | Interactive Marketplace Card: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`. |