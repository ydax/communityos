---
id: story-seo-landing-pages
epic: epic-marketplace-discovery
title: SEO Category Landing Pages
status: ready
priority: P2
persona: consumer
points: 3
depends_on:
  - story-search-index-sync
  - story-marketplace-homepage
blocked_by: []
services_affected:
  - app/events/[city]/page.js
  - app/services/[city]/page.js
  - app/products/[city]/page.js
experimental: false
created_at: 2026-05-01
---

# Story: SEO Category Landing Pages

## User Story

**As a** consumer searching Google for "events in San Marcos",
**I want** to find a CentralTexas.com page with relevant local events,
**So that** I discover the platform through organic search.

## Context

Client-side search (Typesense/Algolia JS client) is invisible to
Googlebot because it requires JavaScript execution. To capture organic
search traffic for high-intent queries like "things to do in Kyle" or
"local services San Marcos", we need server-rendered landing pages.

These are Next.js SSR pages at `/events/[city]`, `/services/[city]`,
and `/products/[city]`. They pre-fetch data from the search index on the
server and render a full HTML page that Google can index.

## Acceptance Criteria

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

## Design Notes

- Simple, content-focused layout (no sidebar filters)
- City name in H1: "Events in San Marcos"
- Listing cards in a clean grid, same style as marketplace
- Include a "Browse by City" section with links to other city pages
- MVP cities: Austin, San Marcos, Kyle, Buda, New Braunfels, San Antonio

## Out of Scope

- Dynamic city detection from URL (only support pre-defined cities)
- Blog or editorial content on landing pages
- Sitemap.xml generation for all landing pages (add later)

## Implementation Reference

- Routes: `app/events/[city]/page.js`, `app/services/[city]/page.js`, `app/products/[city]/page.js` (all new)
- Search API: `app/api/marketplace/search/route.js` (server-side query)

