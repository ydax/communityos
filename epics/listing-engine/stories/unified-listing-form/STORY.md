---
id: story-unified-listing-form
epic: epic-listing-engine
title: Unified Listing Creation Form
status: ready
priority: P0
persona: merchant
points: 8
depends_on:
  - story-polymorphic-schema
blocked_by: []
services_affected:
  - app/admin/listings/new/page.js
  - components/listings/ListingDialog.js
  - components/listings/ServiceForm.js
  - components/listings/GoodForm.js
  - components/listings/MediaDropzone.js
experimental: false
created_at: 2026-05-01
---

# Story: Unified Listing Creation Form

## User Story

**As a** merchant on my dashboard,
**I want** one form that lets me create any type of listing (product, event, service, food, or community post),
**So that** I don't need to learn different interfaces for different offering types.

## Context

The v2 codebase has separate `GoodForm.js` and `ServiceForm.js` components.
The v3 refactor consolidates these into a single dynamic form that adapts
based on the selected listing type.

The form starts with a type selector (large, tappable pill buttons). Once
a type is selected, the form renders:
1. **Base fields** (always visible): title, description, base price, images, tags
2. **Type-specific fields** (conditional): event dates, service duration, etc.
3. **Variants section** (optional): for products and events

The form uses `react-hook-form` with the Zod resolver for client-side
validation. On submit, it calls the listings API which performs server-side
validation with the polymorphic schema.

## Acceptance Criteria

```gherkin
Feature: Unified Listing Creation Form

  Scenario: Merchant creates a product listing
    Given a merchant on /admin/listings/new
    When they select type "Product"
    Then the form shows base fields + product-specific fields (fulfillment, condition)
    And they fill in title "Handmade Candle" and price "$25.00"
    And upload 2 images
    And click "Publish Listing"
    Then a new listing document is created in Firestore with type "PRODUCT"
    And they are redirected to /admin/listings

  Scenario: Merchant creates an event listing
    Given a merchant on /admin/listings/new
    When they select type "Event"
    Then the form shows base fields + event-specific fields (start date, end date, venue, ticketed toggle)
    And they fill in title "Live Music Friday"
    And set start time to June 15, 2026 at 6:00 PM
    And toggle "This is a ticketed event"
    And click "Publish Listing"
    Then a new listing document is created with type "EVENT"
    And details.startTime and details.endTime are saved

  Scenario: Type-specific fields hide when type changes
    Given a merchant who selected "Event" and filled in the start date
    When they change the type selector to "Service"
    Then the event date fields disappear
    And service-specific fields (duration, requires quote) appear
    And the previously entered event data is cleared

  Scenario: Image upload works inline
    Given a merchant on the listing form
    When they drag and drop 3 images onto the media dropzone
    Then thumbnails preview inline
    And images are uploaded to Firebase Storage
    And the mediaUrls array is populated on submit

  Scenario: Form validates before submit
    Given a merchant who clicks "Publish" without entering a title
    Then an inline validation error appears under the title field
    And the form does not submit
    And the error message reads "Title must be at least 3 characters"

  Scenario: Price input converts dollars to cents
    Given a merchant enters "$25.50" in the price field
    When the form submits
    Then basePrice is stored as 2550 (integer cents)
```

## Design Notes

- Type selector: 5 large pill buttons at the top with emoji icons
  (📅 Events, 🛍️ Products, 🛠️ Services, 🍔 Food, 🤝 Community)
- Follow the Form/Input styles from `docs/DESIGN.md` Section 5.2
- Use `react-hook-form` + `@hookform/resolvers` (already installed)
- Price input shows "$" prefix and formats as currency on blur
- Image section reuses `components/listings/MediaDropzone.js`

## Out of Scope

- Draft auto-save (listing saves only on explicit "Publish" or "Save Draft")
- Bulk listing creation
- AI-assisted description generation
- Listing duplication

## Implementation Reference

- Form page: `app/admin/listings/new/page.js`
- Existing forms: `components/listings/GoodForm.js`, `ServiceForm.js`
- Media upload: `components/listings/MediaDropzone.js`
- Schema: `lib/validations/listingSchema.js`
- API: `app/api/listings/route.js`

