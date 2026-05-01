---
id: story-geocoded-location
epic: epic-identity-profiles
title: Server-Side Address Geocoding
status: ready
priority: P1
persona: merchant
points: 2
depends_on:
  - story-merchant-profile-form
blocked_by: []
services_affected:
  - lib/dbServices/sitesService.js
  - app/api/sites/route.js
experimental: false
created_at: 2026-05-01
---

# Story: Server-Side Address Geocoding

## User Story

**As a** merchant who has entered my business address,
**I want** the system to automatically geocode it to latitude/longitude,
**So that** my business appears correctly on the marketplace map and in "near me" search results.

## Context

The marketplace discovery epic requires every merchant to have lat/lng
coordinates for geo-bounded search. Rather than requiring merchants to
pin a map (poor UX on mobile), the system geocodes the street address
server-side using the Google Maps Geocoding API.

This happens as a post-save server action on the sites API route. The
merchant never sees the geocoding step — they enter a human-readable
address and the system handles the rest.

The `@googlemaps/google-maps-services-js` package is already installed
in `package.json`.

## Acceptance Criteria

```gherkin
Feature: Server-Side Address Geocoding

  Scenario: Address is geocoded on profile save
    Given a merchant submits their profile with address "123 Main St, San Marcos, TX"
    When the site document is created in Firestore
    Then the server calls the Google Maps Geocoding API
    And saves location.lat and location.lng to the site document
    And saves location.city as "San Marcos"
    And saves location.formattedAddress as the API-returned formatted string

  Scenario: Geocoding fails gracefully
    Given a merchant submits an unrecognizable address "asdfghjkl"
    When the Geocoding API returns zero results
    Then the site document is still created
    And location.lat and location.lng are set to null
    And a warning is logged
    And the merchant sees a soft prompt: "We couldn't find that address. You can update it later."

  Scenario: Address is re-geocoded on update
    Given a merchant updates their address from "123 Main St" to "456 Elm St"
    When the site document is updated
    Then the server re-geocodes the new address
    And overwrites location.lat and location.lng with new values
```

## Design Notes

- No UI component for this story — it is entirely server-side
- The geocoding call must use the server-side `GOOGLE_MAPS_API_KEY` env var
- Rate-limit consideration: geocoding only fires on address create/update, not on every page load

## Out of Scope

- Google Places Autocomplete on the client-side address input
- Reverse geocoding (lat/lng → address)
- Service radius calculation or display

## Implementation Reference

- Maps SDK: `@googlemaps/google-maps-services-js` (already in package.json)
- Sites API: `app/api/sites/route.js`
- Sites DB: `lib/dbServices/sitesService.js`
