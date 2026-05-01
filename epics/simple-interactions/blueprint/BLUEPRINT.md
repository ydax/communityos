# BLUEPRINT.md

**Last Updated:** 2026-05-01

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| `Inquiry` | `id`, `buyerEmail`, `buyerName`, `buyerPhone`, `listingId`, `merchantId`, `message`, `type` (QUOTE \| RSVP), `status` (NEW \| READ \| RESPONDED), `createdAt` | Represents a quote request or RSVP from a consumer to a merchant. |

## 2. State Machines

| Component | State | Transitions | Description |
|---|---|---|---|
| `InquiryCard` | `collapsed` | `TOGGLE_EXPAND` -> `expanded` | Default state for quote inquiries. Shows summary. |
| `InquiryCard` | `expanded` | `TOGGLE_EXPAND` -> `collapsed` | Shows full message details for quote inquiries. |
| `InquiryStatus` | `unread` | `MARK_AS_READ` -> `read` | Inquiry has a NEW status. Shows blue accent and bold title. |
| `InquiryStatus` | `read` | - | Inquiry has a READ status. Shows gray badge and normal title. |

## 3. Gherkin Scenarios

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

## 4. Component Specifications

| Component | File | Visual/Styling Rules (Tailwind) | Data/Props |
|---|---|---|---|
| `InquiryDashboardPage` | `app/admin/inquiries/page.js` | Uses standard dashboard layout. Main content container: `max-w-5xl mx-auto p-6 lg:p-10`. Header uses `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900`. | Fetches `Inquiry` collection for the current `merchantId`. Manages filter state (All/Quotes/RSVPs). |
| `InquiryCard` | `components/inquiries/InquiryCard.js` | Base: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Unread accent: `border-l-4 border-l-indigo-600`. Title (Unread): `font-inter text-xl font-bold text-slate-900`. Title (Read): `font-inter text-xl font-semibold text-slate-900`. Quote Badge: `bg-indigo-50 text-indigo-700 font-inter text-sm font-medium px-2.5 py-0.5 rounded-full`. RSVP Badge: `bg-amber-50 text-amber-700 font-inter text-sm font-medium px-2.5 py-0.5 rounded-full`. Mark as Read Button: Ghost button style (`inline-flex items-center justify-center rounded-lg bg-transparent px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`). | Props: `inquiry` object, `onMarkAsRead` callback. Internal state: `isExpanded`. |
| `Sidebar` | `components/dashboard/Sidebar.js` | Sidebar container: `fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6`. Badge count: `bg-indigo-600 text-white font-inter text-xs font-bold px-2 py-0.5 rounded-full ml-auto`. | Props: `unreadCount` (number). |