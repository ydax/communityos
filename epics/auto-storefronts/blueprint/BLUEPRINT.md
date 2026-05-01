# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Entities

| Entity | Field | Type | Description |
|---|---|---|---|
| `Site` | `slug` | String | Unique identifier for the merchant's storefront URL (`/m/[slug]`). |
| `Site` | `theme` | String | The selected rigid theme (`TheMaker`, `TheTrade`, `TheVenue`). |
| `Site` | `name` | String | Merchant's business name. |
| `Site` | `bio` | String | Merchant's biography or description. |
| `Site` | `logoUrl` | String | URL to the merchant's logo. |
| `Site` | `hours` | String | Operating hours. |
| `Site` | `location` | Object | Physical address/coordinates for the map pin. |
| `Listing` | `id` | String | Unique identifier for the listing. |
| `Listing` | `siteId` | String | Reference to the parent `Site`. |
| `Listing` | `type` | Enum | The category of the listing (`product`, `event`, `service`). |
| `Listing` | `title` | String | Title of the listing. |
| `Listing` | `status` | String | Active/Inactive status of the listing. |
| `Listing` | `price` | Number | Price (used if type is `product`). |
| `Listing` | `eventDate` | DateTime | Date and time (used if type is `event`). |
| `Listing` | `billingModel` | String | Billing structure, e.g., "From $75/hr" (used if type is `service`). |

## 2. State Machines

### Storefront Tab State
Manages the active tab selection and filtering of the listing grid on the storefront.

*   **State: `INITIALIZING`**
    *   Action: Evaluate available listing types.
    *   Transition -> `SINGLE_TYPE` (if only 1 active type exists).
    *   Transition -> `MULTI_TYPE` (if >1 active types exist).
*   **State: `SINGLE_TYPE`**
    *   Behavior: Tab bar is hidden. All listings of the single type are displayed in the grid.
*   **State: `MULTI_TYPE`**
    *   Behavior: Tab bar is rendered. Default selected tab is set to the first available type (e.g., Products). Grid is filtered to show only listings matching the `activeTab`.
    *   Event: `SELECT_TAB(type)` -> Updates `activeTab` state, triggers animated transition (fade/slide) of the grid content.

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
```

## 4. Component Specifications

| Component | File | Description & Design System Rules |
|---|---|---|
| `StorefrontPage` | `app/m/[slug]/page.js` | **Server Component.** Dynamic route that queries Firestore by `slug`. Fetches the `Site` profile and up to 50 active `Listings` per type. Uses Next.js `generateMetadata` for OpenGraph tags and `revalidate: 60` for ISR. Passes data to `SiteRenderer`. |
| `SiteRenderer` | `components/sites/SiteRenderer.js` | **Client Component.** Receives site and listing data. Manages `activeTab` state. <br><br>**Tab Bar UI:** Renders a horizontal scrollable pill bar on mobile, standard on desktop. <br>- *Active Tab:* `bg-indigo-50 text-indigo-700 rounded-full px-3 py-2 font-medium transition-colors active:scale-[0.98]`<br>- *Inactive Tab:* `text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full px-3 py-2 font-medium transition-colors active:scale-[0.98]`<br>- *Badge:* Shows listing count next to label.<br><br>**Grid UI:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`. Applies a fade/slide animation (`transition-all duration-300 ease-out opacity-0 translate-y-4` to `opacity-100 translate-y-0`) when switching tabs. Hides tab bar entirely if only one listing type exists. |
| `ListingCard` | `components/listings/ListingCard.js` | **UI Component.** Renders an individual listing. <br><br>**Base Style:** Uses the Interactive Marketplace Card primitive: `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`.<br><br>**Dynamic Content:** Adapts based on `type` prop. <br>- *Event:* Prominently displays `eventDate` and time.<br>- *Product:* Displays `price`.<br>- *Service:* Displays `billingModel` (e.g., "From $75/hr"). |
