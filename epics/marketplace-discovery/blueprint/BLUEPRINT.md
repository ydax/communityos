# BLUEPRINT: CentralTexas.com

## Last Updated
2023-10-26

## 1. System Architecture

### Marketplace Discovery Engine
The marketplace discovery layer provides fast, faceted, full-text, and geo-bounded search capabilities. 
- **Indexing Loop:** A Firebase Cloud Function (`onDocumentWritten`) listens to the `listings` collection, flattens the data (including merchant name and location), and upserts it to an external search index (Typesense).
- **Search Flow:** Client requests are routed through `/api/marketplace/search`, which queries the search index and returns faceted results.
- **SEO Strategy:** Next.js Server-Side Rendered (SSR) and Incrementally Static Regenerated (ISR) landing pages are used to capture organic search traffic for high-intent category + city combinations.

## 2. Entities

| Entity | Description | Fields |
|---|---|---|
| **Listing** | Core marketplace item representing an event, service, or product. | `id`, `merchantId`, `type` (EVENT, SERVICE, PRODUCT), `title`, `description`, `price`, `city`, `location` (lat/lng), `status`, `createdAt` |
| **SearchIndexRecord** | Flattened denormalized listing document stored in Typesense. | `id`, `listingId`, `type`, `title`, `description`, `merchantName`, `city`, `coordinates`, `price`, `date` |
| **City** | Supported MVP cities for SEO landing pages. | `name`, `slug` (e.g., "san-marcos", "austin", "kyle", "buda", "new-braunfels", "san-antonio") |

## 3. State Machines

*(No complex state machines defined yet. SEO Landing pages are primarily server-rendered and stateless.)*

## 4. Gherkin Scenarios

### Feature: SEO Category Landing Pages

```gherkin
Feature: SEO Category Landing Pages

  Scenario: Events landing page renders for a city
    Given 15 active event listings in San Marcos
    When Googlebot requests /events/san-marcos
    Then the full HTML response contains all 15 event cards
    And the <title> is "Events in San Marcos | CentralTexas.com"
    And the meta description is "Discover upcoming events, live music, workshops, and more in San Marcos, TX"
    And the page includes JSON-LD structured data (ItemList schema)

  Scenario: Services landing page
    Given active service listings in Austin
    When a user visits /services/austin
    Then the page shows service listings filtered to Austin
    And the <title> is "Local Services in Austin | CentralTexas.com"

  Scenario: Unknown city returns generic page
    Given no city "atlantis" exists in the system
    When a user visits /events/atlantis
    Then the page shows a helpful message: "No events found in Atlantis"
    And suggests browsing all events or selecting a nearby city

  Scenario: Landing pages link to the full marketplace
    Given a consumer on /events/san-marcos
    Then a "See all events" link navigates to /marketplace?type=EVENT

  Scenario: Pages are statically generated with ISR
    Given the page uses generateStaticParams for known cities
    Then the page is statically generated at build time
    And revalidates every 3600 seconds (1 hour)
```

## 5. Component Specifications

| Component | Type | Route/Location | Specification & Design System Rules |
|---|---|---|---|
| **CategoryLandingPage** | Server Component | `app/events/[city]/page.js`, `app/services/[city]/page.js`, `app/products/[city]/page.js` | **Behavior:** Uses `generateStaticParams` for MVP cities. Fetches data server-side from search index. Revalidates every 3600s (ISR). Injects JSON-LD structured data.<br>**Layout:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24`.<br>**Typography:** H1 uses `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight`.<br>**Empty State:** If city is unknown, displays "No [type] found in [City]" with a link to browse all or select a nearby city. |
| **ListingCard** | UI Component | `components/listings/ListingCard.js` | **Visual:** Interactive Marketplace Card. Uses `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`.<br>**Typography:** Title uses `font-outfit text-2xl font-semibold text-slate-900 leading-snug`. Body uses `font-inter text-base font-normal text-slate-600 leading-relaxed`. |
| **CityBrowser** | UI Component | `components/listings/CityBrowser.js` | **Behavior:** Renders a "Browse by City" section linking to other MVP city landing pages.<br>**Visual:** Grid of Secondary Buttons (`inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`). |
| **MarketplaceLink** | UI Component | Embedded in Landing Pages | **Visual:** Primary Button linking to full marketplace (`/marketplace?type=[TYPE]`). Uses `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. |