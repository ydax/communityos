---
id: epic-auto-storefronts
title: Auto-Generated Merchant Storefronts
status: draft
owner: davis
priority: P0
target_release: v3-mvp
services_affected:
  - app/(sites)/[domain]/page.js
  - app/(sites)/[domain]/layout.js
  - app/m/[slug]/page.js
  - components/sites/SiteRenderer.js
  - components/sites/themes/TheMaker.js
  - components/sites/themes/TheTrade.js
  - components/sites/themes/TheVenue.js
  - lib/dbServices/sitesService.js
  - lib/dbServices/listingsService.js
success_metric: >
  A merchant who completes their profile has a live, SEO-optimized
  public page at centraltexas.com/m/{slug} within 5 seconds. The page
  displays their logo, bio, hours, map pin, and a tabbed grid of
  active listings. OpenGraph meta tags are correct for Instagram sharing.
stories:
  - story-storefront-page
  - story-storefront-seo
  - story-theme-selection
  - story-listing-tabs
dependencies:
  - epic-identity-profiles
created_at: 2026-05-01
---

# Epic: Auto-Generated Merchant Storefronts

## Vision

Give every merchant a "Linktree on steroids" — a beautiful, data-driven
public page that requires zero design effort. When a merchant completes
their profile, their storefront exists immediately. When they add listings,
those listings appear on their storefront automatically.

This is the **"Come for the tool"** half of the marketplace strategy. The
storefront is the merchant's shareable digital identity. When they post
their `centraltexas.com/m/joes-bbq` link on Instagram, they drive traffic
to both their business and the platform.

The v3 architecture moves storefronts from custom-domain subdirectories
(`(sites)/[domain]`) to a simpler subdirectory model (`/m/[slug]`). This
eliminates the DNS/SSL complexity that Tony flagged as a "trap" and makes
every storefront a first-class page on the CentralTexas.com domain for
maximum SEO benefit.

## Scope Boundaries

- **IN:** Dynamic `/m/[slug]` route with SSR, merchant profile header
  (logo, name, bio, hours, location map), tabbed listing grid (Shop,
  Events, Services), three rigid theme options, OpenGraph meta tags,
  mobile-first responsive layout.
- **OUT:** Drag-and-drop section editing, custom CSS or color overrides
  beyond theme selection, custom domain mapping, analytics dashboard
  showing storefront views.

## Architecture Reference

The existing `(sites)/[domain]` route group handles multi-tenant rendering
via middleware domain resolution. For v3, the new `/m/[slug]` route is a
simpler Next.js dynamic route that queries Firestore by slug.

The `SiteRenderer` component dispatches to one of three theme components
(`TheMaker`, `TheTrade`, `TheVenue`) based on the site's `theme` field.
These themes are rigid — merchants choose one but cannot customize the
layout. Content is purely data-driven from the `sites` and `listings`
collections.

## Key Design Decisions

1. **Subdirectory, not subdomain.** `/m/joes-bbq` inherits
   CentralTexas.com's domain authority. Subdomains dilute SEO.
2. **SSR with ISR revalidation.** Use Next.js `generateMetadata` for
   OpenGraph tags and `revalidate: 60` for fast but fresh content.
3. **Themes are CSS-only.** The three themes share the same data contract
   and component tree — they differ only in Tailwind class application.
4. **No CMS.** Merchants control content through their profile and
   listings. The storefront renders whatever is in Firestore.

## Open Questions

- [ ] Should we keep the old `(sites)/[domain]` route for backward
      compatibility, or redirect existing sites to `/m/[slug]`?
- [ ] Do we add a "Share" button with pre-formatted Instagram/Twitter text?
- [ ] Should the storefront show a mini-map or just a text address?
