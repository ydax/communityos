---
id: epic-marketplace-discovery
title: Marketplace Discovery Engine
status: draft
owner: davis
priority: P0
target_release: v3-mvp
services_affected:
  - app/marketplace/page.js
  - app/marketplace/[listingId]/page.js
  - app/api/marketplace/listings/route.js
  - app/api/marketplace/search/route.js
  - lib/dbServices/listingsService.js
  - components/listings/ListingCard.js
  - components/listings/ListingFilters.js
  - functions/index.js
success_metric: >
  A consumer landing on centraltexas.com can search for local events,
  products, and services with faceted filters (type, category, location,
  price range). Search results return in under 500ms. Listings are
  geo-bounded to a configurable radius from the user's selected city.
  SEO landing pages for key categories are indexable by Google.
stories:
  - story-search-index-sync
  - story-marketplace-homepage
  - story-faceted-search
  - story-listing-detail-page
  - story-seo-landing-pages
dependencies:
  - epic-listing-engine
created_at: 2026-05-01
---

# Epic: Marketplace Discovery Engine

## Vision

The marketplace is the **"Stay for the network"** half of the strategy.
Every listing from every merchant feeds into a single, searchable,
geo-bounded discovery layer. A consumer should be able to answer three
questions in under 10 seconds: *"What's happening this weekend?"*,
*"What can I buy locally?"*, and *"Who can fix my sink?"*

The existing marketplace page (`app/marketplace/page.js`) uses basic
Firestore queries with client-side enrichment. For v3, we introduce an
external search index (Typesense or Algolia) synced via Cloud Functions
for fast, faceted, full-text + geo search.

## Scope Boundaries

- **IN:** Search index sync via Cloud Functions on listing write,
  marketplace homepage with global search bar, faceted browsing
  (type, price range, date range for events, geo-radius), listing
  detail page, SSR landing pages for SEO.
- **OUT:** Map view with interactive pins (defer), AI-powered
  recommendations, saved searches or alerts, merchant-to-consumer
  messaging from search results.

## Architecture Reference

### The Indexing Loop
A Firebase Cloud Function (`onDocumentWritten`) on the `listings`
collection flattens listing data (including merchant name and location
from the parent `sites` document) and upserts it to the search index.
Deletes and archives remove the document from the index.

### The Search Flow
1. Consumer types in search bar or selects a category pill
2. Client sends request to `/api/marketplace/search`
3. API route queries the search index (not Firestore) with facets
4. Results returned with highlighting and facet counts
5. Client renders results using `ListingCard` components

### SEO Strategy
Next.js SSR pages at `/events/[city]`, `/services/[city]`, and
`/products/[city]` pre-fetch popular category+city combinations
for Google indexing.

## Key Design Decisions

1. **External search index, not Firestore queries.** Firestore cannot
   do full-text search or faceted aggregations natively.
2. **Typesense preferred over Algolia.** Self-hostable, cheaper at
   scale, and has excellent geo-search support. Use Typesense Cloud
   for MVP to avoid infrastructure overhead.
3. **Flatten on index, not on query.** The Cloud Function denormalizes
   merchant name, city, and lat/lng into the search document so queries
   never need to join across collections.
4. **Location defaults to user preference.** If the consumer has set a
   `preferredCity`, use that as the geo-center. Otherwise, use IP-based
   geolocation or prompt them.

## Open Questions

- [ ] Typesense Cloud vs. Algolia? (Cost comparison needed for 10K listings)
- [ ] Should the default search radius be 25 miles or 50 miles?
- [ ] Do we show "sponsored" or "featured" listings at the top?
