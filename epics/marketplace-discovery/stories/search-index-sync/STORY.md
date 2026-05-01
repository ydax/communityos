---
id: story-search-index-sync
epic: epic-marketplace-discovery
title: Search Index Sync via Cloud Functions
status: ready
priority: P0
persona: developer
points: 5
depends_on:
  - story-polymorphic-schema
blocked_by: []
services_affected:
  - functions/index.js
  - lib/dbServices/listingsService.js
  - lib/dbServices/sitesService.js
experimental: false
created_at: 2026-05-01
---

# Story: Search Index Sync via Cloud Functions

## User Story

**As a** developer building the marketplace search,
**I want** Firestore listing changes to automatically sync to an external search index,
**So that** marketplace search queries are fast, faceted, and geo-aware without hitting Firestore directly.

## Context

Firestore is excellent for CRUD but cannot perform full-text search,
faceted aggregations, or geo-radius queries natively. A Cloud Function
triggered by `onDocumentWritten` on the `listings` collection flattens
each listing into a denormalized search document and upserts it to
Typesense (or Algolia).

The search document includes fields from both the listing and its parent
site (merchant name, city, lat/lng) so that search queries never need
to join across collections.

## Acceptance Criteria

```gherkin
Feature: Search Index Sync

  Scenario: New listing is indexed on creation
    Given a merchant creates a new active listing "Handmade Candle"
    When the Firestore write triggers the Cloud Function
    Then a search document is upserted to the search index
    And the document includes: title, description, type, basePrice, tags, images[0]
    And the document includes denormalized: merchantName, city, lat, lng

  Scenario: Listing update re-indexes
    Given an indexed listing "Handmade Candle"
    When the merchant updates the price from $25 to $30
    Then the search document is updated with the new basePrice

  Scenario: Archived listing is removed from index
    Given an indexed listing "Handmade Candle"
    When the merchant archives the listing (status → "archived")
    Then the search document is deleted from the index

  Scenario: Draft listings are not indexed
    Given a merchant creates a listing with status "draft"
    Then no search document is created in the index

  Scenario: Deleted site removes all listings from index
    Given a merchant with 5 indexed listings
    When their site document is deleted
    Then all 5 listing documents are removed from the search index

  Scenario: Function handles missing site gracefully
    Given a listing with a siteId that no longer exists
    When the Cloud Function attempts to denormalize
    Then the function logs a warning and skips indexing
    And no error is thrown
```

## Design Notes

- Use Typesense Cloud for MVP (avoid self-hosting complexity)
- The search document schema should mirror the listing base schema + geo fields
- Index configuration: searchable fields = [title, description, tags, merchantName]
- Facet fields: type, city, tags
- Sort fields: basePrice, createdAt
- Geo field: `location` as `[lat, lng]` for radius queries

## Out of Scope

- Bulk re-indexing CLI tool (build when needed)
- Real-time index consistency guarantees (eventual consistency is acceptable)
- Search analytics (query logs, click-through rates)

## Implementation Reference

- Cloud Function: `functions/index.js` (add `onListingWritten` trigger)
- Sites DB: `lib/dbServices/sitesService.js` (lookup for denormalization)
- Typesense client: new dependency `typesense` (npm package)

