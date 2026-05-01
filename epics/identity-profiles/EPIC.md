---
id: epic-identity-profiles
title: Identity & Merchant Profiles
status: draft
owner: davis
priority: P0
target_release: v3-mvp
services_affected:
  - lib/firebase/client.js
  - lib/firebase/admin.js
  - lib/dbServices/usersService.js
  - lib/dbServices/sitesService.js
  - middleware.js
  - app/api/auth/resolve/route.js
  - app/api/auth/session/route.js
  - components/onboarding/AddListingStep.js
success_metric: >
  A merchant can sign up, provide their business name, bio, hours,
  location, and logo, and have a complete profile stored in Firestore
  with geocoded lat/lng. The system differentiates consumer and merchant
  roles on the same auth flow without separate registration paths.
stories:
  - story-role-based-auth
  - story-merchant-profile-form
  - story-geocoded-location
  - story-consumer-identity
dependencies: []
created_at: 2026-05-01
---

# Epic: Identity & Merchant Profiles

## Vision

Give every local merchant a digital identity on CentralTexas.com. Today,
a micro-merchant in Central Texas has no single "home base" on the local
internet. This epic establishes the foundational identity layer that
every subsequent epic builds on — storefronts, listings, payments, and
discovery all require a merchant profile to exist first.

The core principle: **one authentication flow, two roles.** A consumer
who discovers CentralTexas.com through a weekend event listing should be
able to purchase a ticket immediately. A merchant who arrives to list
their business should be able to claim their profile and start adding
inventory. The system must feel like one product, not two gated
experiences.

## Scope Boundaries

- **IN:** Firebase Auth integration with role differentiation
  (consumer vs. merchant), merchant profile creation form (name, bio,
  hours, location, logo upload), address geocoding to lat/lng on save,
  consumer profile with minimal fields (name, email, location
  preference), profile edit and update flows.
- **OUT:** Social login providers (Google, Facebook) beyond email/OTP,
  merchant verification or "blue check" badges, team/multi-user
  merchant accounts, profile analytics or view counters.

## Architecture Reference

The existing auth system uses Firebase Auth with OTP verification
(`lib/dbServices/otpService.js`). The v3 refactor introduces a `role`
field on the user document (`consumers` default, `merchant` on upgrade).
The `usersService.js` already handles basic user CRUD — this epic
extends it with profile fields and geocoding.

Merchant profiles live in the existing `sites` collection but gain new
fields: `bio`, `hours`, `location.lat`, `location.lng`, and `logoUrl`.
The profile form replaces the current AI-generation wizard as the
primary onboarding entry point for merchants.

## Key Design Decisions

1. **Role on user document, not separate collections.** A user starts
   as a consumer and "upgrades" to merchant by completing the profile
   form. This avoids duplicate auth records.
2. **Geocoding happens server-side on save.** The profile form collects
   a street address; a server action calls the Google Maps Geocoding
   API and writes lat/lng to Firestore. This keeps API keys off the
   client.
3. **Hours as structured JSON, not free text.** Store hours as
   `{ mon: { open: "09:00", close: "17:00" }, ... }` to enable
   future "Open Now" filtering on the marketplace.
4. **Logo upload via Firebase Storage.** Reuse the existing
   `lib/utils/uploadImage.js` utility with a new `logos/` prefix.

## Open Questions

- [ ] Should merchants be able to claim an existing consumer account,
      or must they register fresh?
- [ ] Do we need email verification before a merchant can publish
      listings, or is OTP sufficient?
- [ ] Should the profile form auto-fill from Google Places Autocomplete?
