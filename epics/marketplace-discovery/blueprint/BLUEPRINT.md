# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Listing` | A marketplace item (Product, Event, Service, Food, Community) | `id`, `type`, `title`, `description`, `images`, `price`, `variants`, `date`, `venue`, `ticketTiers`, `merchantId` |
| `Site` | The merchant/business profile associated with a listing | `id`, `name`, `logo`, `slug` |

## 2. State Machines

### Image Gallery State
- **State: `Idle`** - Displays the first image as the main hero image.
- **State: `ThumbnailSelected`** - Updates the main hero image to the selected thumbnail.

### Variant Selector State
- **State: `Unselected`** - Default state if no variant is pre-selected.
- **State: `Selected`** - Updates the displayed price and enables the CTA button based on the chosen variant.

## 3. Gherkin Scenarios

### Feature: Listing Detail Page

```gherkin
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

## 4. Component Specifications

| Component | Type | Description / Design System Tokens |
|---|---|---|
| `ListingDetailPage` | Server Page | `app/marketplace/[listingId]/page.js`. Fetches listing and site data directly from Firestore. Layout uses `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` and `grid-cols-1 lg:grid-cols-12`. Handles 404 if listing is missing. Generates OpenGraph meta tags. |
| `ImageGallery` | Client Component | Horizontal scroll with thumbnails below on desktop. Uses `rounded-2xl` for the main image to match standard card radiuses. |
| `ListingPrice` | UI Component | Large, bold price display using `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`. |
| `ListingCTA` | Client Component | Primary Button: `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. Full-width on mobile (`w-full`), inline on desktop. |
| `MerchantCard` | UI Component | Standard Card: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Contains logo, name (`font-outfit text-2xl font-semibold text-slate-900`), and "Visit Storefront →" link. |
| `VariantSelector` | Client Component | Dropdown for product variants. Uses standard input base: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20`. |
| `Breadcrumb` | UI Component | Navigation aid: Marketplace > {Type} > {Listing Title}. Uses `font-inter text-sm font-medium text-slate-500`. |