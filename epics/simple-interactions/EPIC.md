---
id: epic-simple-interactions
title: Simple Interactions (Quotes & RSVPs)
status: draft
owner: davis
priority: P1
target_release: v3-mvp
services_affected:
  - app/api/inquiries/route.js
  - app/api/rsvp/route.js
  - app/marketplace/[listingId]/page.js
  - components/listings/RequestQuoteForm.js
  - components/listings/RsvpButton.js
  - lib/dbServices/inquiriesService.js
success_metric: >
  A consumer can submit a "Request Quote" form on a service listing and
  the merchant receives an email with the inquiry details. A consumer can
  RSVP to a free community event. Both interactions are tracked in
  Firestore and visible in the merchant's dashboard.
stories:
  - story-request-quote-form
  - story-free-rsvp
  - story-inquiry-dashboard
dependencies:
  - epic-listing-engine
  - epic-marketplace-discovery
created_at: 2026-05-01
---

# Epic: Simple Interactions (Quotes & RSVPs)

## Vision

Not every listing has a "Buy Now" button. Services require quotes.
Community events are free. This epic provides lightweight interaction
mechanisms for non-buyable listings, ensuring that every listing type
has a clear call-to-action.

The principle is **lead generation, not scheduling.** A plumber on
CentralTexas.com doesn't need a full Calendly integration. They need
a "Request Quote" form that captures the consumer's name, phone, and
problem description, and emails it to them. Similarly, free events need
a simple RSVP mechanism for headcount planning.

## Scope Boundaries

- **IN:** "Request a Quote" form for SERVICE listings, free RSVP for
  COMMUNITY listings, email notification to merchants via transactional
  email service, inquiry records in Firestore, merchant inquiry dashboard.
- **OUT:** Two-way calendar booking sync, real-time chat between consumer
  and merchant, automated quote generation, RSVP reminders or calendar
  invites, paid event RSVPs (those use the checkout flow).

## Architecture Reference

Inquiries are stored in a new `inquiries` Firestore collection with
fields: buyerEmail, buyerName, buyerPhone, listingId, merchantId,
message, type (QUOTE | RSVP), status (NEW | READ | RESPONDED), createdAt.

Email notifications use a transactional email service (Resend or
SendGrid). The email is sent server-side from the API route, not from
the client.

## Key Design Decisions

1. **Email-first, not in-app messaging.** Merchants already check email.
   Building an in-app inbox is a major feature that delays launch.
2. **Inquiries are fire-and-forget for consumers.** They submit the form
   and see a confirmation. No conversation thread or status tracking.
3. **RSVP is just a counter + email.** No seat selection, no ticket PDF,
   no QR codes. Just a name + email captured, headcount incremented,
   and a confirmation email sent.
4. **Rate limiting on forms.** Prevent spam by limiting to 5 inquiries
   per email per hour.

## Open Questions

- [ ] Resend or SendGrid for transactional emails?
- [ ] Should the merchant be able to reply to inquiries from the
      dashboard, or only via email?
- [ ] Should RSVP show a public attendee count on the listing page?
