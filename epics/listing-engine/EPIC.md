---
id: epic-listing-engine
title: Universal Listing Engine
status: draft
owner: davis
priority: P0
target_release: v3-mvp
services_affected:
  - lib/validations/listingSchema.js
  - lib/dbServices/listingsService.js
  - lib/dbServices/inventoryService.js
  - app/api/listings/route.js
  - app/api/listings/[listingId]/route.js
  - app/admin/listings/page.js
  - app/admin/listings/new/page.js
  - components/listings/ListingDialog.js
  - components/listings/ListingCard.js
  - components/listings/ServiceForm.js
  - components/listings/GoodForm.js
  - components/listings/VariantForm.js
success_metric: >
  A merchant can create, edit, and manage listings of any type (Product,
  Event, Service, Food, Community) through a single unified form that
  adapts dynamically based on the selected type. All listings share a
  common base schema for marketplace search while supporting type-specific
  extension fields via a polymorphic details payload.
stories:
  - story-polymorphic-schema
  - story-unified-listing-form
  - story-event-listing-type
  - story-variant-management
  - story-listing-dashboard
dependencies:
  - epic-identity-profiles
created_at: 2026-05-01
---

# Epic: Universal Listing Engine

## Vision

One form to rule them all. A merchant on CentralTexas.com sells BBQ on
weekends, hosts a live music night on Fridays, and offers catering
services. Today, those three activities would require three different
software products. CommunityOS gives them a single dashboard where they
can manage products, events, and services in one place.

The key architectural decision (per Tony's recommendation) is a
**polymorphic document model**. Every listing shares a "Base Schema"
that powers global marketplace search and standard UI cards. Type-specific
data (event dates, service duration, product fulfillment) lives in a
`details` JSON map on the same document. This means one Firestore
collection, one search index, and one card component — with conditional
rendering based on `listing.type`.

## Scope Boundaries

- **IN:** Polymorphic Zod schema with 5 listing types (PRODUCT, EVENT,
  SERVICE, FOOD, COMMUNITY), unified creation form with dynamic
  type-specific fields, basic variant support (size, ticket tier),
  listing CRUD API, merchant listing dashboard, image upload.
- **OUT:** Drag-and-drop listing ordering, bulk import/export, complex
  restaurant modifier trees, inventory sync with external POS,
  scheduled publish/unpublish, listing analytics.

## Architecture Reference

The existing codebase has a `listingSchema.js` that supports two types
(`good` and `service`). The v3 refactor expands this to five types while
maintaining backward compatibility. The existing `listingsService.js`
CRUD operations remain largely intact — the polymorphic `details` field
is simply an additional JSON map that Firestore stores natively.

The form UI uses a type selector at the top that conditionally renders
type-specific field groups. The base fields (title, description, price,
images, tags, location) are always visible.

## Key Design Decisions

1. **Single `listings` collection.** No separate collections for events
   vs products. Tony's polymorphic model is the correct approach for
   marketplace-scale search.
2. **Prices in cents (integers).** `basePrice: 7500` = $75.00. This
   avoids floating-point rounding errors in payment calculations.
3. **Tags over taxonomy.** Free-form tags (`#vegan`, `#livemusic`)
   instead of deep category trees. Level 2 categories only when a
   Level 1 hits 100+ listings.
4. **Details as a JSON map.** The `details` field is unstructured from
   Firestore's perspective but validated by Zod discriminated unions.
5. **Variants as a flat array.** Variants live on the listing document
   (not a subcollection) to avoid N+1 queries on the marketplace.

## Open Questions

- [ ] Should FOOD be a separate type or a tag on PRODUCT?
- [ ] Should COMMUNITY listings (free announcements) bypass the payment
      epic entirely, or have a $0 checkout for RSVP tracking?
- [ ] Max variants per listing? (Suggest 10 for MVP)
