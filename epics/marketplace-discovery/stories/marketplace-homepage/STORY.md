---
id: story-marketplace-homepage
epic: epic-marketplace-discovery
title: Marketplace Homepage & Global Search
status: ready
priority: P0
persona: consumer
points: 5
depends_on:
  - story-search-index-sync
blocked_by: []
services_affected:
  - app/marketplace/page.js
  - app/api/marketplace/search/route.js
  - components/listings/ListingCard.js
experimental: false
created_at: 2026-05-01
---

# Story: Marketplace Homepage & Global Search

## User Story

**As a** local consumer visiting centraltexas.com,
**I want** a marketplace homepage with a search bar and category browsing,
**So that** I can discover events, products, and services near me.

## Context

The marketplace homepage is the primary consumer landing page. It features:
1. A large hero search bar ("What are you looking for in Central Texas?")
2. Category pills (Events, Products, Services, Food, Community)
3. A "Happening This Weekend" featured section (events with upcoming dates)
4. A grid of recent/popular listings

All data comes from the search index via `/api/marketplace/search`, not
from direct Firestore queries. This ensures consistent performance
regardless of collection size.

## Acceptance Criteria

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

## Design Notes

- Hero section: full-width gradient background with large centered search input
- Search input uses the glassmorphic style from `docs/DESIGN.md`
- Category pills: horizontal scroll on mobile, centered row on desktop
- "Happening This Weekend": horizontal scroll card carousel
- Results grid: 1-col mobile, 2-col tablet, 3-col desktop
- Interactive Marketplace Card style for all listing cards
- Loading state: premium shimmer skeleton from `docs/DESIGN.md` Section 6

## Out of Scope

- Map view with pins
- "Near me" using device GPS (IP-based or manual city selection for MVP)
- Infinite scroll (use "Load More" button, capped at 50 results)
- Personalized recommendations

## Implementation Reference

- Page: `app/marketplace/page.js`
- Search API: `app/api/marketplace/search/route.js` (new)
- Card: `components/listings/ListingCard.js`

