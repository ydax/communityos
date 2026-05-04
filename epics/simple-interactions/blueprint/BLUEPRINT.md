# BLUEPRINT.md

*Last Updated: 2024-05-20*

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

### InquiryCard State Machine
| State | Event | Next State | Actions |
|---|---|---|---|
| UNREAD_COLLAPSED | CLICK_EXPAND | UNREAD_EXPANDED | Reveal full message details |
| UNREAD_EXPANDED | CLICK_COLLAPSED | UNREAD_COLLAPSED | Hide message details |
| UNREAD_COLLAPSED | CLICK_MARK_READ | READ_COLLAPSED | Trigger API call to update status to 'READ', change badge to gray, remove blue border |
| UNREAD_EXPANDED | CLICK_MARK_READ | READ_EXPANDED | Trigger API call to update status to 'READ', change badge to gray, remove blue border |
| READ_COLLAPSED | CLICK_EXPAND | READ_EXPANDED | Reveal full message details |
| READ_EXPANDED | CLICK_COLLAPSED | READ_COLLAPSED | Hide message details |

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

### Merchant Inquiry Dashboard

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

## Component Specifications

| Component | Type | Specification |
|---|---|---|
| `RsvpButton` | UI Component | **Visual**: Full-width prominent button. Default state uses Secondary Button style: `inline-flex items-center justify-center w-full rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. Success state ("You're Going! ✓"): `bg-emerald-500 text-white hover:bg-emerald-600 border-transparent`. Inline form inputs use standard text input base: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`.<br><br>**Behavioral**: On click, if logged out, expands inline form for name/email. If logged in, submits directly to `/api/rsvp`. On success, transitions to SUCCESS state and disables interaction. |
| `ListingDetailPage` | Page | **Visual**: Displays RSVP count as small text below the button (`font-inter text-sm font-medium text-slate-600 mt-2 text-center block`).<br><br>**Behavioral**: Fetches `rsvpCount` from listing document. Checks if current user has already RSVPed to set initial state of `RsvpButton`. |
| `InquiryDashboardPage` | Page | **Visual**: Uses Dashboard SaaS Canvas (`bg-slate-100`). Main content area constrained with `max-w-5xl mx-auto` and `p-6 lg:p-10`. Includes a filter toggle group (All, Quotes Only, RSVPs Only) using Secondary Button styles.<br><br>**Behavioral**: Fetches inquiries from `inquiriesService` for the current merchant. Sorts chronologically (newest first). Manages local state for type filtering. |
| `InquiryCard` | UI Component | **Visual**: Standard Card base: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Unread state adds a left border accent: `border-l-4 border-l-indigo-600` and bold title `font-inter text-lg font-bold text-slate-900`. Read state title: `font-semibold`. Type Badges: Quote uses `bg-indigo-50 text-indigo-700`, RSVP uses `bg-amber-50 text-amber-700`. Status Badge: New uses `bg-indigo-50 text-indigo-700`, Read uses `bg-slate-100 text-slate-600`. "Mark as Read" button uses Ghost/Tertiary Button style.<br><br>**Behavioral**: Toggles expansion to show full message details for QUOTE types. "Mark as Read" click triggers API update to Firestore and updates local status state. |
| `Sidebar` | UI Component | **Visual**: Fixed left rail `w-64 bg-slate-50 border-r border-slate-200`. Badge count for unread inquiries is a small indigo circle: `inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full`.<br><br>**Behavioral**: Fetches or subscribes to the count of unread inquiries (`status === 'NEW'`) for the merchant. Updates dynamically when inquiries are marked as read. |