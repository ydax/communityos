---
id: story-free-rsvp
epic: epic-simple-interactions
title: Free Event RSVP
status: ready
priority: P1
persona: consumer
points: 2
depends_on:
  - story-listing-detail-page
  - story-event-listing-type
blocked_by: []
services_affected:
  - app/marketplace/[listingId]/page.js
  - app/api/rsvp/route.js
  - components/listings/RsvpButton.js
experimental: false
created_at: 2026-05-01
---

# Story: Free Event RSVP

## User Story

**As a** consumer who wants to attend a free community event,
**I want** to RSVP with one click,
**So that** the organizer knows I'm coming and I get a confirmation.

## Context

COMMUNITY and free EVENT listings don't go through Stripe checkout.
Instead, they show an RSVP button that captures the consumer's email
and increments a headcount on the listing document.

RSVPs are lightweight: email + name, stored in the `inquiries` collection
with type "RSVP". The organizer receives an email notification. The
listing detail page shows the current RSVP count.

## Acceptance Criteria

```gherkin
Feature: Free Event RSVP

  Scenario: Logged-in consumer RSVPs to a free event
    Given a COMMUNITY listing "Neighborhood Cleanup Day" with isTicketed: false
    And a logged-in consumer
    When they click "RSVP — I'll Be There!"
    Then an inquiry document is created with type "RSVP"
    And the listing's rsvpCount is incremented by 1
    And the button changes to "You're Going! ✓"
    And a confirmation email is sent to the consumer

  Scenario: Anonymous consumer must provide email
    Given a non-logged-in visitor on a free event page
    When they click "RSVP"
    Then a compact inline form appears asking for name and email
    And submitting creates the RSVP

  Scenario: Duplicate RSVP is prevented
    Given a consumer who has already RSVPed to "Neighborhood Cleanup Day"
    When they visit the same listing again
    Then the button shows "You're Going! ✓" (not the RSVP button)
    And they cannot RSVP again

  Scenario: RSVP count is displayed
    Given an event with 23 RSVPs
    When a consumer views the listing detail page
    Then the page shows "23 people going"

  Scenario: Organizer receives RSVP notification
    Given a consumer RSVPs to an event
    Then the organizer receives an email: "New RSVP for Neighborhood Cleanup Day"
    And the email includes the consumer's name and email
```

## Design Notes

- RSVP button: full-width, prominent, use Secondary Button style with emoji
- "You're Going!" state: green background with check icon
- RSVP count: small text below the button ("23 people going")
- Confirmation email: simple, branded, with event date/time reminder

## Out of Scope

- RSVP cancellation
- Waitlist for capacity-limited free events
- Calendar invite (.ics) generation
- RSVP reminder emails before the event

## Implementation Reference

- RSVP button: `components/listings/RsvpButton.js` (new)
- API route: `app/api/rsvp/route.js` (new)
- Listing detail: `app/marketplace/[listingId]/page.js`
- Inquiries DB: `lib/dbServices/inquiriesService.js`

 
