---
id: story-event-listing-type
epic: epic-listing-engine
title: Event Listing Type & Ticketing Fields
status: ready
priority: P0
persona: merchant
points: 3
depends_on:
  - story-polymorphic-schema
blocked_by: []
services_affected:
  - lib/validations/listingSchema.js
  - components/listings/ListingCard.js
experimental: false
created_at: 2026-05-01
---

# Story: Event Listing Type & Ticketing Fields

## User Story

**As a** local event organizer,
**I want** to list my event with date, time, venue, and ticket tiers,
**So that** locals can discover my event on the marketplace and buy tickets.

## Context

Per Tony's strategic insight, events and tickets are the ultimate wedge
for CommunityOS. They have built-in virality (organizers post links to
sell tickets) and solve a real consumer problem ("What's happening this
weekend?").

The EVENT type extends the base listing schema with temporal fields
(startTime, endTime), venue information, and a ticketed/free toggle.
Ticketed events use the variants array for ticket tiers (General Admission,
VIP, etc.).

The listing card component must render event-specific UI: a prominent
date badge, time range, and venue name.

## Acceptance Criteria

```gherkin
Feature: Event Listing Type

  Scenario: Event listing displays date prominently
    Given an event listing with startTime "2026-06-15T18:00:00Z"
    When rendered as a ListingCard
    Then the card shows a date badge: "JUN 15" in large text
    And shows the time: "6:00 PM"
    And shows the venue name below the title

  Scenario: Ticketed event has ticket tiers as variants
    Given a ticketed event "Farm Festival"
    When the merchant adds variants:
      | name              | priceDelta | inventoryCount |
      | General Admission | 0          | 200            |
      | VIP               | 2500       | 50             |
    Then the event listing has 2 variants
    And GA ticket price = basePrice + 0
    And VIP ticket price = basePrice + 2500

  Scenario: Free event has no variants
    Given a community event with isTicketed: false
    Then the listing card shows "Free Event" instead of a price
    And the CTA button says "RSVP" instead of "Buy Tickets"

  Scenario: Past events are visually muted
    Given an event with endTime before the current date
    When displayed on the marketplace or storefront
    Then the card shows a "Past Event" badge
    And the card opacity is reduced
    And the "Buy Tickets" button is disabled
```

## Design Notes

- Event date badge: bold month abbreviation + day number, left-aligned on card
- Use `docs/DESIGN.md` amber accent for event-type badges
- Time display: human-readable format (e.g., "Sat, Jun 15 · 6:00 PM")
- Ticketed events show "From $XX" using the cheapest variant price

## Out of Scope

- Recurring events (one-off only for MVP)
- Calendar integration (iCal export, Google Calendar add)
- Event capacity tracking beyond variant inventoryCount
- Multi-day events with separate day passes

## Implementation Reference

- Schema: `lib/validations/listingSchema.js` (EVENT details discriminant)
- Card: `components/listings/ListingCard.js`

 
