# BLUEPRINT.md

*Last Updated: 2023-10-24*

## Entities

| Entity | Field | Type | Description |
|---|---|---|---|
| Inquiry | id | string | Unique identifier |
| Inquiry | buyerEmail | string | Consumer's email address |
| Inquiry | buyerName | string | Consumer's name |
| Inquiry | buyerPhone | string | Consumer's phone number (optional for RSVP) |
| Inquiry | listingId | string | Reference to the listing |
| Inquiry | merchantId | string | Reference to the merchant/organizer |
| Inquiry | message | string | Optional message (mostly for quotes) |
| Inquiry | type | string | Enum: 'QUOTE' \| 'RSVP' |
| Inquiry | status | string | Enum: 'NEW' \| 'READ' \| 'RESPONDED' |
| Inquiry | createdAt | timestamp | When the inquiry was created |
| Listing | rsvpCount | number | Counter for total RSVPs on a community/event listing |

## State Machines

### RsvpButton State Machine
| State | Event | Next State | Actions |
|---|---|---|---|
| IDLE | CLICK_RSVP (Logged In) | LOADING | Trigger API call to `/api/rsvp` |
| IDLE | CLICK_RSVP (Logged Out) | FORM_OPEN | Display inline form for name and email |
| FORM_OPEN | SUBMIT_FORM | LOADING | Trigger API call to `/api/rsvp` with form data |
| LOADING | API_SUCCESS | SUCCESS | Show "You're Going! ✓", increment local count, disable button |
| LOADING | API_ERROR | ERROR | Show error message |
| ERROR | RETRY | LOADING | Trigger API call again |
| SUCCESS | - | - | Button becomes non-interactive |

## Gherkin Scenarios

### Free Event RSVP

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

## Component Specifications

| Component | Type | Specification |
|---|---|---|
| `RsvpButton` | UI Component | **Visual**: Full-width prominent button. Default state uses Secondary Button style: `inline-flex items-center justify-center w-full rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. Success state ("You're Going! ✓"): `bg-emerald-500 text-white hover:bg-emerald-600 border-transparent`. Inline form inputs use standard text input base: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`.<br><br>**Behavioral**: On click, if logged out, expands inline form for name/email. If logged in, submits directly to `/api/rsvp`. On success, transitions to SUCCESS state and disables interaction. |
| `ListingDetailPage` | Page | **Visual**: Displays RSVP count as small text below the button (`font-inter text-sm font-medium text-slate-600 mt-2 text-center block`).<br><br>**Behavioral**: Fetches `rsvpCount` from listing document. Checks if current user has already RSVPed to set initial state of `RsvpButton`. |
