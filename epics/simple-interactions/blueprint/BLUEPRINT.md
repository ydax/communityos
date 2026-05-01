# Blueprint

**Last Updated:** 2023-10-24 (Today)

## Entities

| Entity | Description | Fields |
|---|---|---|
| `Inquiry` | Represents a consumer's request for a quote or an RSVP to an event. | `id` (String, PK)<br>`buyerEmail` (String)<br>`buyerName` (String)<br>`buyerPhone` (String, Optional)<br>`listingId` (String)<br>`merchantId` (String)<br>`message` (String)<br>`type` (Enum: QUOTE, RSVP)<br>`status` (Enum: NEW, READ, RESPONDED)<br>`createdAt` (Timestamp) |

## State Machines

### `RequestQuoteForm` State Machine
| State | Event | Next State | Actions/Side Effects |
|---|---|---|---|
| `IDLE` | `SUBMIT_FORM` | `SUBMITTING` | Validate inputs. If invalid, stay `IDLE` and show errors. If valid, call `POST /api/inquiries`. |
| `SUBMITTING` | `API_SUCCESS` | `SUCCESS` | Render success confirmation card. |
| `SUBMITTING` | `API_ERROR_429` | `RATE_LIMITED` | Show rate limit error message. |
| `SUBMITTING` | `API_ERROR_OTHER` | `ERROR` | Show generic error message. |
| `ERROR` / `RATE_LIMITED` | `SUBMIT_FORM` | `SUBMITTING` | Retry API call. |

## Scenarios

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

## Component Specifications

### 1. `RequestQuoteForm`
*   **Path:** `components/listings/RequestQuoteForm.js`
*   **Responsibilities:** Render the inline quote request form, handle user input, validate required fields, submit data to the API, and display success/error states.
*   **Props:** 
    *   `listingId` (String)
    *   `merchantId` (String)
    *   `listingTitle` (String)
    *   `user` (Object, Optional) - Logged-in user context for pre-filling.
*   **Visuals (Design System Enforcement):**
    *   **Container:** Rendered inline (not a modal).
    *   **Labels:** `block text-sm font-medium text-slate-700 mb-1.5`
    *   **Inputs (Name, Email, Phone, Message):** `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`
    *   **Input Error State:** Append `border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900` to invalid fields.
    *   **Submit Button:** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`
    *   **Success State:** Replace form with a success card: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Include a green check icon (`text-emerald-500`) and the success message.
*   **Behavior:**
    *   On mount, if `user` prop exists, pre-fill `email` and `name` (if `displayName` exists).
    *   On submit, validate that `email` is provided. If missing, show inline validation error: "Email is required".
    *   Call `POST /api/inquiries` with form data, `listingId`, `merchantId`, and `type: 'QUOTE'`.
    *   If API returns 429, display: "You've reached the maximum number of requests. Please try again later."
    *   If API returns 200, transition to `SUCCESS` state and show: "Quote request sent! The merchant will contact you soon."

### 2. `ListingDetailPage`
*   **Path:** `app/marketplace/[listingId]/page.js`
*   **Responsibilities:** Display the listing details and conditionally render the appropriate call-to-action based on the listing type.
*   **Updates:**
    *   Import and render `<RequestQuoteForm />` if the listing type is `SERVICE`.
    *   Pass `listingId`, `merchantId`, `listingTitle`, and the current `user` session to the form.

### 3. `Inquiries API Route`
*   **Path:** `app/api/inquiries/route.js`
*   **Responsibilities:** Handle incoming inquiry submissions, enforce rate limits, save to database, and trigger merchant emails.
*   **Behavior:**
    *   Accept `POST` requests with payload: `buyerName`, `buyerEmail`, `buyerPhone`, `message`, `listingId`, `merchantId`, `type`.
    *   **Rate Limiting:** Check recent submissions for `buyerEmail`. If >= 5 in the last hour, return `429 Too Many Requests`.
    *   Call `inquiriesService.createInquiry()` to store the record in Firestore.
    *   Trigger transactional email (via Resend/SendGrid) to the merchant.
        *   Subject: "New Quote Request: [Listing Title]"
        *   Body: Include consumer name, email, phone, and message.
        *   Include a `mailto:` "Reply" link that opens the merchant's email client with the consumer's email pre-filled.
    *   Return `200 OK` on success.

### 4. `Inquiries Database Service`
*   **Path:** `lib/dbServices/inquiriesService.js`
*   **Responsibilities:** Firestore operations for the `inquiries` collection.
*   **Behavior:**
    *   `createInquiry(data)`: Inserts a new document into the `inquiries` collection with `status: 'NEW'` and `createdAt: serverTimestamp()`.
    *   `getRecentInquiryCountByEmail(email, timeWindow)`: Queries the collection to count inquiries by the given email within the specified time window (used for rate limiting).