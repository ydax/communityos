---
id: story-listing-tabs
epic: epic-auto-storefronts
title: Tabbed Listing Display on Storefronts
status: ready
priority: P1
persona: consumer
points: 3
depends_on:
  - story-storefront-page
blocked_by: []
services_affected:
  - app/m/[slug]/page.js
  - components/sites/SiteRenderer.js
  - components/listings/ListingCard.js
experimental: false
created_at: 2026-05-01
---

# Story: Tabbed Listing Display on Storefronts

## User Story

**As a** consumer visiting a merchant's storefront,
**I want** to browse their offerings organized by type (Shop, Events, Services),
**So that** I can quickly find what I'm looking for.

## Context

A merchant may have multiple listing types. Rather than showing a flat
unsorted grid, the storefront organizes listings into tabs based on their
`type` field. Only tabs with active listings are shown.

The tab bar sits between the profile header and the listing grid. It uses
a horizontal scrollable pill bar on mobile and a standard tab bar on desktop.

## Acceptance Criteria

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

## Design Notes

- Tab bar uses pill-style buttons from `docs/DESIGN.md`
- Active tab: `bg-indigo-50 text-indigo-700`, inactive: `text-slate-600`
- Listing count badge next to each tab label
- Grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Cards use the Interactive Marketplace Card style with type-specific badges

## Out of Scope

- Search or filtering within a tab
- Sorting by price or date
- Infinite scroll or pagination (cap at 50 listings per type for MVP)

## Implementation Reference

- Route: `app/m/[slug]/page.js`
- Card: `components/listings/ListingCard.js`
- Renderer: `components/sites/SiteRenderer.js`

