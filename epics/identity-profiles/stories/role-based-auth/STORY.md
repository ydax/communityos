---
id: story-role-based-auth
epic: epic-identity-profiles
title: Role-Based Authentication
status: ready
priority: P0
persona: user
points: 3
depends_on: []
blocked_by: []
services_affected:
  - lib/firebase/admin.js
  - lib/dbServices/usersService.js
  - middleware.js
  - app/api/auth/resolve/route.js
  - app/api/auth/session/route.js
  - app/login/page.js
experimental: false
created_at: 2026-05-01
---

# Story: Role-Based Authentication

## User Story

**As a** visitor to CentralTexas.com,
**I want** a single sign-up flow that lets me become either a consumer or a merchant,
**So that** I can start browsing or listing my business without hitting a dead-end registration wall.

## Context

The existing auth system uses Firebase Auth with OTP verification. In v2,
authentication was tightly coupled to the AI site-generation wizard — users
could only sign up by creating a website. For v3, auth must be decoupled
from site generation and support two distinct roles.

The `users` Firestore collection gains a `role` field: `consumer` (default)
or `merchant`. Consumers can browse and purchase. Merchants can do
everything consumers can, plus manage profiles, listings, and storefronts.

The middleware already gates `/admin/*` routes. It must be extended to check
the `role` field and redirect consumers who attempt to access merchant
dashboards to a "Become a Merchant" upgrade prompt.

## Acceptance Criteria

```gherkin
Feature: Role-Based Authentication

  Scenario: New user signs up as a consumer
    Given a visitor on the login page
    When they enter their email and complete OTP verification
    Then a user document is created in Firestore with role "consumer"
    And they are redirected to the marketplace homepage

  Scenario: Consumer upgrades to merchant
    Given a logged-in consumer
    When they click "List Your Business" from the marketplace header
    Then they are redirected to the merchant profile form
    And completing the profile sets their role to "merchant"
    And they gain access to the /admin dashboard

  Scenario: Existing merchant logs in
    Given a user with role "merchant"
    When they log in successfully
    Then they are redirected to the /admin dashboard

  Scenario: Consumer attempts to access merchant dashboard
    Given a logged-in consumer
    When they navigate to /admin
    Then the middleware redirects them to the "Become a Merchant" page
    And they see a prompt to complete their merchant profile

  Scenario: Unauthenticated user attempts protected route
    Given a visitor who is not logged in
    When they navigate to /admin or /admin/listings
    Then they are redirected to the login page
    And after login they return to the originally requested route
```

## Design Notes

- The login page should feel welcoming and premium per `docs/DESIGN.md`
- Use the glassmorphic card style for the auth form
- "List Your Business" CTA in the marketplace header uses the Primary Button style
- Mobile-first: the login form must work perfectly on iPhone

## Out of Scope

- Social login providers (Google, Apple, Facebook)
- Multi-factor authentication beyond OTP
- Team accounts or multi-user merchant orgs
- Admin/superuser roles for platform operators

## Implementation Reference

- Auth API: `app/api/auth/resolve/route.js`, `app/api/auth/verify-otp/route.js`
- Middleware: `middleware.js` (route gating logic)
- Users DB: `lib/dbServices/usersService.js`
- Login UI: `app/login/page.js`

