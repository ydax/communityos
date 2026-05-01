---
id: story-listing-detail-page
epic: epic-marketplace-discovery
title: Listing Detail Page
status: ready
priority: P1
persona: consumer
points: 3
depends_on:
  - story-marketplace-homepage
blocked_by: []
services_affected:
  - app/marketplace/[listingId]/page.js
  - lib/dbServices/listingsService.js
  - components/listings/ListingCard.js
experimental: false
created_at: 2026-05-01
---

# Story: Listing Detail Page

## User Story

**As a** consumer who found an interesting listing on the marketplace,
**I want** to view its full details including images, description, variants, and merchant info,
**So that** I can make an informed decision before purchasing or contacting the merchant.

## Context

The listing detail page at `/marketplace/[listingId]` is the conversion
page — where browsing turns into action. It fetches the listing document
directly from Firestore (not the search index) for full data fidelity.

The page adapts layout based on listing type:
- **Product:** Image gallery, price, variant selector, "Buy Now" button
- **Event:** Hero image, date/time, venue info, ticket tiers, "Get Tickets"
- **Service:** Description, pricing model, service area, "Request Quote"
- **Food:** Image, dietary tags, pre-order info
- **Community:** Description, RSVP button

The merchant's mini-profile (name, logo, link to storefront) is always
visible in a sidebar card.

## Acceptance Criteria

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

## Design Notes

- Image gallery: horizontal scroll with thumbnails below on desktop
- Price display: large, bold, `text-slate-900`
- CTA button: full-width Primary Button on mobile, inline on desktop
- Merchant card: Standard Card with logo, name, and "Visit Storefront →" link
- Breadcrumb: Marketplace > {Type} > {Listing Title}

## Out of Scope

- Reviews or ratings
- "Related listings" recommendations
- Social sharing buttons
- Listing view count or analytics

## Implementation Reference

- Page: `app/marketplace/[listingId]/page.js`
- Listings DB: `lib/dbServices/listingsService.js` (`getListingById`)
- Sites DB: `lib/dbServices/sitesService.js` (merchant info)
