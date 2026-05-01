---
id: story-request-quote-form
epic: epic-simple-interactions
title: Request a Quote Form
status: ready
priority: P0
persona: consumer
points: 3
depends_on:
  - story-listing-detail-page
blocked_by: []
services_affected:
  - app/marketplace/[listingId]/page.js
  - app/api/inquiries/route.js
  - components/listings/RequestQuoteForm.js
  - lib/dbServices/inquiriesService.js
experimental: false
created_at: 2026-05-01
---

# Story: Request a Quote Form

## User Story

**As a** consumer who needs a local service (plumbing, tutoring, etc.),
**I want** to submit a contact form directly from the listing page,
**So that** the merchant receives my inquiry and can follow up with a quote.

## Context

SERVICE listings don't have a "Buy Now" flow. Instead, they show a
"Request a Quote" form that captures the consumer's name, email, phone,
and a message describing what they need.

On submission, the API creates an `inquiries` document in Firestore and
sends a notification email to the merchant with the inquiry details.
The consumer sees a confirmation message.

## Acceptance Criteria

```gherkin
Feature: Request a Quote Form

  Scenario: Consumer submits a quote request
    Given a consumer on a SERVICE listing detail page
    When they fill in name "Jane Doe", email "jane@email.com", phone "512-555-1234"
    And write a message "Need kitchen faucet replaced"
    And click "Request Quote"
    Then an inquiry document is created in Firestore with type "QUOTE"
    And a notification email is sent to the merchant
    And the consumer sees "Quote request sent! The merchant will contact you soon."

  Scenario: Form validates required fields
    Given a consumer on the quote request form
    When they click "Request Quote" without entering an email
    Then an inline validation error shows: "Email is required"
    And the form does not submit

  Scenario: Rate limiting prevents spam
    Given a consumer who has submitted 5 quote requests in the last hour
    When they attempt to submit another
    Then the API returns a 429 error
    And the form shows "You've reached the maximum number of requests. Please try again later."

  Scenario: Merchant email includes full inquiry details
    Given a consumer submits a quote request
    When the notification email is sent to the merchant
    Then the email subject is "New Quote Request: Kitchen Faucet Repair"
    And the body includes: consumer name, email, phone, and message
    And a "Reply" link that opens their email client

  Scenario: Pre-fill form for logged-in consumers
    Given a logged-in consumer with email "jane@email.com"
    When they open the quote request form
    Then the email field is pre-filled with "jane@email.com"
    And the name field is pre-filled if displayName exists
```

## Design Notes

- Form appears inline on the listing detail page (not a modal)
- Use the Form/Input styles from `docs/DESIGN.md` Section 5.2
- Submit button uses the Primary Button style
- Confirmation: replace the form with a success card (green check icon)
- Phone field is optional but encouraged

## Out of Scope

- File attachment (photos of the issue)
- In-app conversation thread
- Quote response form for merchants
- SMS notification to merchants

## Implementation Reference

- Form component: `components/listings/RequestQuoteForm.js` (new)
- API route: `app/api/inquiries/route.js` (new)
- DB service: `lib/dbServices/inquiriesService.js` (new)
- Listing detail: `app/marketplace/[listingId]/page.js`

