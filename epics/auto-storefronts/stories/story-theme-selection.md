---
id: story-theme-selection
epic: epic-auto-storefronts
title: Storefront Theme Selection
status: ready
priority: P1
persona: merchant
points: 3
depends_on:
  - story-storefront-page
blocked_by: []
services_affected:
  - components/editor/ThemeSelector.js
  - components/sites/SiteRenderer.js
  - components/sites/themes/TheMaker.js
  - components/sites/themes/TheTrade.js
  - components/sites/themes/TheVenue.js
  - lib/dbServices/sitesService.js
experimental: false
created_at: 2026-05-01
---

# Story: Storefront Theme Selection

## User Story

**As a** merchant customizing my storefront,
**I want** to choose between three curated theme styles,
**So that** my page reflects my business personality without me needing design skills.

## Context

CommunityOS offers three rigid themes as defined in `docs/DESIGN.md`
Section 7. These are not templates with customizable layouts — they are
CSS-only variations on the same data-driven page structure.

The merchant selects their theme in the dashboard. The selection is stored
as a `theme` field on their site document. The `SiteRenderer` dispatches
to the correct theme component based on this value.

The three themes:
- **The Maker** — Earthy, organic, warm. Amber accents, rounded corners.
- **The Trade** — Structured, professional, high-contrast. Indigo/slate.
- **The Venue** — Immersive, moody, dark mode. Full-bleed, glassmorphism.

## Acceptance Criteria

```gherkin
Feature: Storefront Theme Selection

  Scenario: Merchant selects a theme
    Given a merchant on their dashboard settings page
    When they view the Theme Selector
    Then they see three theme previews: "The Maker", "The Trade", "The Venue"
    And clicking one highlights it as selected

  Scenario: Theme is saved to Firestore
    Given a merchant selects "The Venue"
    When they click "Save"
    Then the site document's theme field is updated to "venue"
    And their public storefront re-renders with The Venue theme

  Scenario: Default theme is applied
    Given a new merchant who hasn't selected a theme
    Then their storefront renders with "The Trade" as the default theme

  Scenario: Theme changes are reflected immediately
    Given a merchant previewing their storefront in the dashboard
    When they switch from "The Trade" to "The Maker"
    Then the preview updates in real-time without a page reload
```

## Design Notes

- Theme selector shows three large, clickable preview cards
- Each card shows a miniature mock of what the storefront looks like
- Active selection has a check mark and indigo ring border
- Follow the archetype overrides defined in `docs/DESIGN.md` Section 7

## Out of Scope

- Custom brand color pickers beyond the theme defaults
- Custom font selection
- Section reordering within themes
- Theme preview with the merchant's actual data (use mock data in previews)

## Implementation Reference

- Theme selector: `components/editor/ThemeSelector.js`
- Site renderer: `components/sites/SiteRenderer.js`
- Themes: `components/sites/themes/TheMaker.js`, `TheTrade.js`, `TheVenue.js`
- Sites DB: `lib/dbServices/sitesService.js`
