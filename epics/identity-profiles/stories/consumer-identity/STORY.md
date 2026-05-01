---
id: story-consumer-identity
epic: epic-identity-profiles
title: Consumer Identity & Preferences
status: ready
priority: P2
persona: consumer
points: 2
depends_on:
  - story-role-based-auth
blocked_by: []
services_affected:
  - lib/dbServices/usersService.js
  - app/api/auth/resolve/route.js
experimental: false
created_at: 2026-05-01
---

# Story: Consumer Identity & Preferences

## User Story

**As a** local consumer on CentralTexas.com,
**I want** to save my name and preferred city,
**So that** the marketplace defaults to showing me events and listings near my location.

## Context

Consumers have a lightweight identity compared to merchants. On sign-up
(or first purchase), the system captures their name and email (from auth).
Optionally, they can set a "home city" preference which defaults the
marketplace geo-filter.

This story ensures the `users` document stores the minimal consumer
fields needed for personalized marketplace discovery without requiring
a heavy profile form.

## Acceptance Criteria

```gherkin
Feature: Consumer Identity & Preferences

  Scenario: Consumer profile is auto-created on first login
    Given a new user completes OTP verification
    When they are redirected to the marketplace
    Then a user document exists in Firestore with role "consumer"
    And displayName is set from the email prefix
    And preferredCity defaults to null

  Scenario: Consumer sets their preferred city
    Given a logged-in consumer on the marketplace
    When they click the location selector in the header
    And choose "San Marcos" from the city list
    Then preferredCity is saved to their user document
    And the marketplace re-filters to show San Marcos listings first

  Scenario: Consumer profile is minimal
    Given a consumer user document
    Then it contains only: uid, email, displayName, role, preferredCity, createdAt
    And it does NOT contain merchant-specific fields like hours or bio
```

## Design Notes

- City selector is a dropdown or pill bar in the marketplace header
- MVP cities: Austin, San Marcos, Kyle, Buda, New Braunfels, San Antonio
- The selector should remember the last choice via the user document

## Out of Scope

- Full consumer profile pages visible to merchants
- Purchase history or order tracking
- Consumer-to-consumer messaging
- Saved/favorited listings

## Implementation Reference

- Users DB: `lib/dbServices/usersService.js`
- Auth API: `app/api/auth/resolve/route.js`

