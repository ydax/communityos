---
id: story-storefront-seo
epic: epic-auto-storefronts
title: Storefront SEO & OpenGraph
status: ready
priority: P0
persona: merchant
points: 2
depends_on:
  - story-storefront-page
blocked_by: []
services_affected:
  - app/m/[slug]/page.js
  - app/layout.js
experimental: false
created_at: 2026-05-01
---

# Story: Storefront SEO & OpenGraph

## User Story

**As a** merchant sharing my storefront link on Instagram or Facebook,
**I want** the link preview to show my business name, logo, and description,
**So that** people are more likely to click through and visit my page.

## Context

Next.js App Router supports `generateMetadata` for dynamic OpenGraph tags.
Each storefront page must generate unique `<title>`, `<meta description>`,
`og:title`, `og:description`, `og:image`, and `og:url` tags based on the
merchant's profile data.

This is critical for the viral loop: merchants post their storefront link
on social media → rich preview attracts clicks → consumers land on the
platform → discover the marketplace.

## Acceptance Criteria

```gherkin
Feature: Storefront SEO & OpenGraph

  Scenario: Dynamic meta tags are generated
    Given a merchant "Joe's BBQ" with bio "Best brisket in San Marcos"
    When a search engine indexes /m/joes-bbq
    Then the <title> tag is "Joe's BBQ | CentralTexas.com"
    And the meta description is "Best brisket in San Marcos"
    And og:title is "Joe's BBQ"
    And og:description is "Best brisket in San Marcos"
    And og:url is "https://centraltexas.com/m/joes-bbq"

  Scenario: OpenGraph image uses merchant logo
    Given a merchant with a logoUrl set
    When their storefront link is shared on Instagram
    Then the link preview shows their logo as the og:image

  Scenario: Fallback meta for merchants without a bio
    Given a merchant who left the bio field empty
    Then the meta description defaults to "{Business Name} on CentralTexas.com — your local marketplace"

  Scenario: Canonical URL is set correctly
    Given a merchant storefront at /m/river-city-scapes
    Then the canonical URL meta tag points to https://centraltexas.com/m/river-city-scapes
```

## Design Notes

- og:image should be 1200x630 minimum for optimal social previews
- If no logo exists, use a branded CentralTexas.com fallback image
- Include structured data (JSON-LD LocalBusiness schema) for Google rich results

## Out of Scope

- Dynamic OG image generation (e.g., auto-composited images with text overlay)
- Twitter Card meta tags (defer to OpenGraph fallback)
- Sitemap generation for all storefronts

## Implementation Reference

- Route: `app/m/[slug]/page.js` (`generateMetadata` export)
- Root layout: `app/layout.js` (default meta tags)

