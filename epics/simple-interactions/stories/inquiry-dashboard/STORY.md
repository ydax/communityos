---
id: story-inquiry-dashboard
epic: epic-simple-interactions
title: Merchant Inquiry Dashboard
status: ready
priority: P2
persona: merchant
points: 3
depends_on:
  - story-request-quote-form
  - story-free-rsvp
blocked_by: []
services_affected:
  - app/admin/inquiries/page.js
  - lib/dbServices/inquiriesService.js
experimental: false
created_at: 2026-05-01
---

# Story: Merchant Inquiry Dashboard

## User Story

**As a** merchant receiving quote requests and RSVPs,
**I want** a dashboard page that shows all incoming inquiries,
**So that** I can track who has contacted me and respond promptly.

## Context

The `/admin/inquiries` page shows a chronological list of all inquiries
(quotes + RSVPs) for the merchant's listings. Each inquiry shows the
consumer's name, email, message (for quotes), listing title, and
timestamp.

Merchants can mark inquiries as "Read" to track which ones they've
responded to. This is a simple status toggle, not a full CRM.

## Acceptance Criteria

```gherkin
Feature: Merchant Inquiry Dashboard

  Scenario: Dashboard shows all inquiries
    Given a merchant with 3 quote requests and 5 RSVPs
    When they navigate to /admin/inquiries
    Then all 8 inquiries appear in a chronological list (newest first)
    And each shows: type badge (Quote/RSVP), consumer name, listing title, date

  Scenario: Quote inquiry shows full details
    Given a QUOTE inquiry from "Jane Doe" about "Kitchen Repair"
    When the merchant clicks to expand it
    Then they see: email, phone, and the full message
    And a "Mark as Read" button

  Scenario: RSVP inquiry shows minimal details
    Given an RSVP inquiry from "John Smith" for "Cleanup Day"
    When displayed in the list
    Then it shows name, email, and the event name
    And no message field (RSVPs don't have messages)

  Scenario: Marking an inquiry as read
    Given an unread inquiry with a blue "New" badge
    When the merchant clicks "Mark as Read"
    Then the badge changes to gray "Read"
    And the inquiry's status is updated in Firestore

  Scenario: Unread count in sidebar navigation
    Given a merchant with 3 unread inquiries
    Then the sidebar navigation shows "Inquiries (3)" with a badge count
    And the count updates when inquiries are marked as read

  Scenario: Filter by inquiry type
    Given inquiries of both types
    When the merchant clicks the "Quotes Only" filter
    Then only QUOTE inquiries are shown
```

## Design Notes

- List items use the Standard Card style
- Unread items have a left blue border accent and bold title
- Type badge: "Quote" in indigo, "RSVP" in amber
- Expand/collapse for quote message details
- Sidebar badge count: small indigo circle with white number

## Out of Scope

- In-app reply to inquiries (merchants reply via email)
- Inquiry deletion or archival
- Export inquiries to CSV
- Analytics (response time, conversion rate)

## Implementation Reference

- Page: `app/admin/inquiries/page.js` (new)
- DB service: `lib/dbServices/inquiriesService.js`
- Sidebar: `components/dashboard/Sidebar.js` (add badge count)

 
