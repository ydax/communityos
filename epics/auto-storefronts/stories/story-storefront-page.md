---
id: story-storefront-page
epic: epic-auto-storefronts
title: Dynamic Storefront Page
status: ready
priority: P0
persona: consumer
points: 5
depends_on:
  - story-merchant-profile-form
blocked_by: []
services_affected:
  - app/m/[slug]/page.js
  - lib/dbServices/sitesService.js
  - lib/dbServices/listingsService.js
  - components/sites/SiteRenderer.js
experimental: false
created_at: 2026-05-01
---

# Story: Dynamic Storefront Page

## User Story

**As a** consumer who clicks a merchant's link on Instagram,
**I want** to see a beautiful, fast-loading page with the merchant's info and offerings,
**So that** I can quickly understand what they offer and take action.

## Context

The `/m/[slug]` route is a Next.js dynamic page that fetches a merchant's
site document by slug and renders their storefront. It uses Server-Side
Rendering (SSR) with Incremental Static Regeneration (ISR) for performance.

The page layout follows the "Linktree meets Shopify Lite" pattern:
- **Top section:** Cover photo / hero area, logo, business name, bio, hours,
  location (city + map link)
- **Bottom section:** Tabbed grid of active listings, organized by type

The page must render in under 2 seconds on a 4G mobile connection.

## Acceptance Criteria

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

## Design Notes

- Follow the storefront architecture from `docs/DESIGN.md` Section 7
- Hero section uses full-width cover photo with logo overlay
- Business hours display as a compact "Open Now" / "Closed" badge with expandable schedule
- Listing cards use the Interactive Marketplace Card style
- Mobile: single-column stack, desktop: 2-3 column grid for listings

## Out of Scope

- Cover photo upload (use a default gradient or generated hero for MVP)
- Business hours "Open Now" real-time calculation (just show the schedule)
- Social media links section
- Review/rating display

## Implementation Reference

- Route: `app/m/[slug]/page.js` (new file)
- Site lookup: `lib/dbServices/sitesService.js` (add `getSiteBySlug`)
- Listings: `lib/dbServices/listingsService.js` (`listListingsBySite`)
- Renderer: `components/sites/SiteRenderer.js`
