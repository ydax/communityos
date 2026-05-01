---
id: story-polymorphic-schema
epic: epic-listing-engine
title: Polymorphic Listing Schema
status: ready
priority: P0
persona: developer
points: 5
depends_on: []
blocked_by: []
services_affected:
  - lib/validations/listingSchema.js
  - lib/dbServices/listingsService.js
  - app/api/listings/route.js
  - app/api/listings/[listingId]/route.js
experimental: false
created_at: 2026-05-01
---

# Story: Polymorphic Listing Schema

## User Story

**As a** developer building the marketplace,
**I want** a single Zod schema that validates all listing types with shared base fields and type-specific extensions,
**So that** I can query one Firestore collection for global search while safely validating type-specific data at the API boundary.

## Context

The existing `listingSchema.js` supports two types (`good` and `service`)
with a `.refine()` for conditional validation. The v3 refactor replaces
this with a Zod discriminated union on the `type` field, supporting five
types: PRODUCT, EVENT, SERVICE, FOOD, and COMMUNITY.

All types share a Base Schema (title, description, basePrice, images,
tags, location). Each type adds a `details` object with type-specific
fields validated by the discriminated union.

The `variants` array is also part of the base schema but is optional and
primarily used by PRODUCT and EVENT types (for size/tier).

The API routes (`app/api/listings/`) must use the new schema for both
creation and updates. The Firestore service layer passes validated data
through without additional transformation.

## Acceptance Criteria

```gherkin
Feature: Polymorphic Listing Schema

  Scenario: Product listing validates correctly
    Given a listing payload with type "PRODUCT"
    And base fields: title, description, basePrice, images, tags
    And details: { fulfillment: ["PICKUP"], condition: "new" }
    When the schema validates the payload
    Then validation succeeds
    And the parsed output includes the details object

  Scenario: Event listing validates with required date fields
    Given a listing payload with type "EVENT"
    And details: { startTime: "2026-06-15T18:00:00Z", endTime: "2026-06-15T22:00:00Z", venueName: "The Pearl", isTicketed: true }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Event listing rejects missing startTime
    Given a listing payload with type "EVENT"
    And details: { venueName: "The Pearl" }
    When the schema validates the payload
    Then validation fails with error on details.startTime

  Scenario: Service listing validates lead-gen fields
    Given a listing payload with type "SERVICE"
    And details: { estimatedDurationMins: 60, requiresQuote: true, serviceArea: "San Marcos" }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Base fields are enforced across all types
    Given a listing payload of any type missing the title field
    When the schema validates the payload
    Then validation fails with error on title

  Scenario: Prices are validated as integer cents
    Given a listing with basePrice: 75.50 (not an integer)
    When the schema validates the payload
    Then validation fails with "Price must be a whole number (in cents)"

  Scenario: Tags are free-form strings
    Given a listing with tags: ["vegan", "live-music", "family-friendly"]
    When the schema validates the payload
    Then validation succeeds
    And tags are preserved as-is

  Scenario: Variants array validates
    Given a listing with variants: [{ name: "VIP", priceDelta: 2500, inventoryCount: 50 }]
    When the schema validates the payload
    Then validation succeeds
    And each variant has an auto-generated id
```

## Design Notes

- Use Zod's `z.discriminatedUnion("type", [...])` for clean error messages
- Export type constants: `LISTING_TYPES = ['PRODUCT', 'EVENT', 'SERVICE', 'FOOD', 'COMMUNITY']`
- Maintain backward compat: add a migration note for existing `good` → `PRODUCT` and `service` → `SERVICE`
- Keep `FOOD` details minimal for MVP: `{ dietaryTags: string[], isPreOrder: boolean }`
- `COMMUNITY` details: `{ isFree: true, rsvpEnabled: boolean }`

## Out of Scope

- Database migration of existing v2 listings to the new schema
- Complex nested variant option trees (e.g., Color × Size matrix)
- Schema versioning or migration system

## Implementation Reference

- Schema: `lib/validations/listingSchema.js`
- Service: `lib/dbServices/listingsService.js`
- API routes: `app/api/listings/route.js`, `app/api/listings/[listingId]/route.js`
