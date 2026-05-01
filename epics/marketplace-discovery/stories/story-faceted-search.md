---
id: story-faceted-search
epic: epic-marketplace-discovery
title: Faceted Search & Dynamic Filters
status: ready
priority: P1
persona: consumer
points: 5
depends_on:
  - story-marketplace-homepage
blocked_by: []
services_affected:
  - app/api/marketplace/search/route.js
  - components/listings/ListingFilters.js
  - app/marketplace/page.js
experimental: false
created_at: 2026-05-01
---

# Story: Faceted Search & Dynamic Filters

## User Story

**As a** consumer searching the marketplace,
**I want** to refine results with dynamic filters that change based on the selected category,
**So that** I can quickly narrow down to exactly what I need.

## Context

Faceted search means the available filter options update dynamically
based on the current result set. When a user selects "Events", a
date-range filter appears. When they select "Products", a price-range
slider appears instead.

The search index returns facet counts alongside results, so the UI can
show how many listings match each filter value (e.g., "San Marcos (23)").

## Acceptance Criteria

```gherkin
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
```

## Design Notes

- Filter panel: collapsible sidebar on desktop, bottom sheet on mobile
- Filter chips: pill-style with "×" dismiss, above the results grid
- Price range: dual-handle slider with numeric inputs
- Date range: pre-built options (This Weekend, This Month) + date picker
- City filter: checkbox list with counts, scrollable
- Tags filter: most popular 10 tags shown, "Show all" expandable

## Out of Scope

- Saved filters or filter presets
- "Sort by" options (relevance-ranked by default)
- Filter suggestions based on search query
- Real-time filter count updates without submitting

## Implementation Reference

- Filters: `components/listings/ListingFilters.js`
- Search API: `app/api/marketplace/search/route.js`
- Page: `app/marketplace/page.js`
