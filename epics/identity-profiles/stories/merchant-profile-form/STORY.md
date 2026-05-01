---
id: story-merchant-profile-form
epic: epic-identity-profiles
title: Merchant Profile Form
status: ready
priority: P0
persona: merchant
points: 5
depends_on:
  - story-role-based-auth
blocked_by: []
services_affected:
  - lib/dbServices/sitesService.js
  - lib/dbServices/usersService.js
  - lib/utils/uploadImage.js
  - app/get-started/page.js
  - components/onboarding/AddListingStep.js
experimental: false
created_at: 2026-05-01
---

# Story: Merchant Profile Form

## User Story

**As a** local business owner,
**I want** to fill out my business name, bio, hours, location, and upload my logo,
**So that** I have a complete digital profile that powers my storefront and marketplace presence.

## Context

This form is the primary onboarding flow for merchants in v3. It replaces
the AI site-generation wizard as the entry point. The form writes to the
`sites` collection (which represents a merchant's business presence) and
upgrades the user's role to `merchant` in the `users` collection.

The form should be a multi-step wizard (not a single long form) to reduce
cognitive load for non-technical business owners. Steps:
1. Business Name & Category
2. Bio / Description (with AI assist option)
3. Business Hours
4. Address & Service Area
5. Logo Upload & Brand Color

All fields save to Firestore on completion. The `slug` is auto-generated
from the business name (e.g., "Joe's BBQ" → `joes-bbq`) with collision
detection.

## Acceptance Criteria

```gherkin
Feature: Merchant Profile Form

  Scenario: Merchant completes the profile wizard
    Given a logged-in consumer on the "Get Started" page
    When they enter a business name "River City Scapes"
    And select category "Services"
    And write a bio
    And set business hours for Monday through Friday
    And enter their street address
    And upload a logo image
    And click "Launch My Storefront"
    Then a site document is created in Firestore
    And the site has a generated slug "river-city-scapes"
    And the user's role is updated to "merchant"
    And they are redirected to their /admin dashboard

  Scenario: Slug collision is handled
    Given a site with slug "joes-bbq" already exists
    When a new merchant enters business name "Joe's BBQ"
    Then the system generates slug "joes-bbq-2"
    And the slug is unique across all sites

  Scenario: Logo upload succeeds
    Given a merchant on the logo upload step
    When they upload a 10MB iPhone photo
    Then the image is compressed and resized
    And stored in Firebase Storage under logos/{siteId}
    And the logoUrl is saved to the site document

  Scenario: Required fields are enforced
    Given a merchant on the profile wizard
    When they attempt to submit without a business name
    Then an inline validation error appears on the business name field
    And the form does not submit

  Scenario: Business hours are stored as structured JSON
    Given a merchant sets hours: Monday 9AM-5PM, Tuesday 9AM-5PM
    When the form is submitted
    Then the site document hours field contains structured JSON
    And closed days have null values
```

## Design Notes

- Multi-step wizard with progress indicator (pill steps at top)
- Each step fits on one mobile screen without scrolling
- Use the Standard Card style from `docs/DESIGN.md` for each step
- Logo upload uses drag-and-drop with preview (reuse `MediaDropzone`)
- Category selection uses large, tappable pill buttons (not a dropdown)
- Brand color picker should offer 8 curated presets, not a full color wheel

## Out of Scope

- AI-generated bios (defer to a future enhancement)
- Social media link fields
- Multiple locations per merchant
- Profile completeness percentage indicator

## Implementation Reference

- Onboarding UI: `app/get-started/page.js`
- Sites DB: `lib/dbServices/sitesService.js`
- Image upload: `lib/utils/uploadImage.js`
- Media component: `components/listings/MediaDropzone.js`

