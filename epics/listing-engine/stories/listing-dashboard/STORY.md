---
id: story-listing-dashboard
epic: epic-listing-engine
title: Merchant Listing Dashboard
status: ready
priority: P1
persona: merchant
points: 3
depends_on:
  - story-unified-listing-form
blocked_by: []
services_affected:
  - app/admin/listings/page.js
  - components/listings/ListingGrid.js
  - components/listings/ListingFilters.js
  - components/listings/ListingCard.js
experimental: false
created_at: 2026-05-01
---

# Story: Merchant Listing Dashboard

## User Story

**As a** merchant managing my business on CentralTexas.com,
**I want** a dashboard page that shows all my listings with filters and quick actions,
**So that** I can see my entire inventory at a glance and manage it efficiently.

## Context

The `/admin/listings` page is the merchant's control center for their
inventory. It displays all listings (across all types) in a filterable
grid with quick-action buttons for edit, duplicate, and archive.

The existing `ListingGrid` and `ListingFilters` components handle the
display logic. This story adapts them for the v3 polymorphic types and
adds status/type filtering.

## Acceptance Criteria

```gherkin
Feature: Merchant Listing Dashboard

  Scenario: Dashboard shows all merchant listings
    Given a merchant with 5 active listings of mixed types
    When they navigate to /admin/listings
    Then all 5 listings appear in a grid
    And each card shows the listing type badge, title, price, and status

  Scenario: Filter by listing type
    Given a merchant with products, events, and services
    When they click the "Events" filter pill
    Then only event listings are shown
    And the pill is highlighted as active

  Scenario: Filter by status
    Given a merchant with active and draft listings
    When they select "Drafts" from the status filter
    Then only draft listings are shown

  Scenario: Quick action to edit
    Given a listing card on the dashboard
    When the merchant clicks "Edit"
    Then they are navigated to /admin/listings/{listingId}/edit

  Scenario: Quick action to archive
    Given an active listing on the dashboard
    When the merchant clicks the archive icon
    Then a confirmation prompt appears
    And confirming sets the listing status to "archived"
    And the listing disappears from the active view

  Scenario: Empty state for new merchants
    Given a merchant with no listings
    When they visit /admin/listings
    Then a friendly empty state shows: "No listings yet"
    And a prominent "Create Your First Listing" button is displayed
```

## Design Notes

- Use Standard Card style from `docs/DESIGN.md` for listing cards
- Type badge in top-left corner of each card (color-coded per type)
- Status indicator: green dot for active, gray dot for draft, red for archived
- Filter bar: horizontal scrollable pills for types, dropdown for status
- "Create Listing" FAB (floating action button) on mobile

## Out of Scope

- Bulk edit or bulk archive
- Listing analytics (views, clicks)
- Drag-and-drop reordering
- Sorting by price or date (alphabetical by default)

## Implementation Reference

- Page: `app/admin/listings/page.js`
- Grid: `components/listings/ListingGrid.js`
- Filters: `components/listings/ListingFilters.js`
- Card: `components/listings/ListingCard.js`

 
