# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Entities

| Entity | Field | Type | Description |
|---|---|---|---|
| Inquiry | buyerEmail | String | Consumer's email address |
| Inquiry | buyerName | String | Consumer's full name |
| Inquiry | buyerPhone | String | Consumer's phone number (optional for RSVP) |
| Inquiry | listingId | String | Reference to the Listing |
| Inquiry | merchantId | String | Reference to the Merchant |
| Inquiry | type | String | Enum: "QUOTE" \| "RSVP" |
| Inquiry | status | String | Enum: "NEW" \| "READ" \| "RESPONDED" |
| Inquiry | message | String | Optional message from consumer |
| Inquiry | createdAt | Timestamp | When the inquiry was created |
| Listing | rsvpCount | Number | Counter for total RSVPs |
| Listing | isTicketed | Boolean | False for free community events |
| Listing | type | String | "COMMUNITY" or "EVENT" |

## 2. State Machines

### RsvpButton (`components/listings/RsvpButton.js`)
| State | Trigger | Next State | Description |
|---|---|---|---|
| `idle` | User clicks "RSVP" (logged in) | `submitting` | Shows "RSVP — I'll Be There!" |
| `idle` | User clicks "RSVP" (anonymous) | `form_open` | Expands to show inline name/email form |
| `form_open` | User submits form | `submitting` | Validates input and submits |
| `submitting` | API returns success | `success` | Shows loading indicator |
| `submitting` | API returns error | `error` | Shows error message |
| `success` | None | `success` | Shows "You're Going! ✓" with green background |

## 3. Gherkin Scenarios

### Feature: Free Event RSVP

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

## 4. Component Specifications

| Component | File | Track | Specification |
|---|---|---|---|
| RsvpButton | `components/listings/RsvpButton.js` | visual_and_behavioral | **Visual:** Full-width button (`w-full`). Default state uses Secondary Button design system tokens (`inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`). Success state ("You're Going! ✓") uses Success tokens (`bg-emerald-500 text-white hover:bg-emerald-600 border-transparent`). RSVP count text below button uses `font-inter text-sm font-medium text-slate-500 mt-2 text-center block`. Inline form inputs use standard Text Input tokens (`block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`). <br><br>**Behavioral:** Checks if user is logged in. If yes, submits RSVP immediately on click. If no, expands inline form for name/email. Calls `/api/rsvp` on submit. Handles loading and success states. Disables if user already RSVPed. |
| ListingDetailPage | `app/marketplace/[listingId]/page.js` | visual_and_behavioral | **Visual:** Integrates `RsvpButton` in the listing action area. <br><br>**Behavioral:** Fetches listing data including `rsvpCount` and `isTicketed`. Passes listing ID, merchant ID, and current user status to `RsvpButton`. |
| RsvpApiRoute | `app/api/rsvp/route.js` | behavioral | **Behavioral:** POST endpoint. Accepts `listingId`, `merchantId`, `buyerName`, `buyerEmail`. Validates input. Creates document in `inquiries` collection with `type: "RSVP"`. Atomically increments `rsvpCount` on the listing document. Triggers transactional email to merchant and confirmation email to consumer. Implements rate limiting (max 5 per email per hour). |
| InquiriesService | `lib/dbServices/inquiriesService.js` | behavioral | **Behavioral:** Provides DB methods: `createInquiry(data)` and `checkExistingRsvp(listingId, email)`. |