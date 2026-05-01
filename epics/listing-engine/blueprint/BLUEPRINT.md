# BLUEPRINT: Universal Listing Engine

Last Updated: 2023-10-25

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Listing` | Polymorphic document representing any offering (Product, Event, Service, Food, Community). | `id` (string)<br>`type` (enum: PRODUCT, EVENT, SERVICE, FOOD, COMMUNITY)<br>`title` (string)<br>`description` (string)<br>`basePrice` (integer, cents)<br>`images` (array of strings)<br>`tags` (array of strings)<br>`details` (JSON map, polymorphic based on type)<br>`variants` (array of objects) |

## 2. State Machines

### Unified Listing Form State
| State | Event | Next State | Actions/Side Effects |
|---|---|---|---|
| `IDLE` | `SELECT_TYPE` | `TYPE_SELECTED` | Set `listing.type`, render type-specific fields, clear previous type data. |
| `TYPE_SELECTED` | `UPLOAD_IMAGE` | `UPLOADING_MEDIA` | Trigger Firebase Storage upload, show inline preview. |
| `UPLOADING_MEDIA` | `UPLOAD_SUCCESS` | `TYPE_SELECTED` | Append to `mediaUrls` array. |
| `TYPE_SELECTED` | `SUBMIT_FORM` | `VALIDATING` | Run Zod client-side validation. |
| `VALIDATING` | `VALIDATION_FAILED` | `TYPE_SELECTED` | Show inline validation errors. |
| `VALIDATING` | `VALIDATION_SUCCESS` | `SUBMITTING` | Convert price to cents, call API. |
| `SUBMITTING` | `API_SUCCESS` | `SUCCESS` | Redirect to `/admin/listings`. |
| `SUBMITTING` | `API_ERROR` | `TYPE_SELECTED` | Show error toast. |

## 3. Gherkin Scenarios

```gherkin
Feature: Unified Listing Creation Form

  Scenario: Merchant creates a product listing
    Given a merchant on /admin/listings/new
    When they select type "Product"
    Then the form shows base fields + product-specific fields (fulfillment, condition)
    And they fill in title "Handmade Candle" and price "$25.00"
    And upload 2 images
    And click "Publish Listing"
    Then a new listing document is created in Firestore with type "PRODUCT"
    And they are redirected to /admin/listings

  Scenario: Merchant creates an event listing
    Given a merchant on /admin/listings/new
    When they select type "Event"
    Then the form shows base fields + event-specific fields (start date, end date, venue, ticketed toggle)
    And they fill in title "Live Music Friday"
    And set start time to June 15, 2026 at 6:00 PM
    And toggle "This is a ticketed event"
    And click "Publish Listing"
    Then a new listing document is created with type "EVENT"
    And details.startTime and details.endTime are saved

  Scenario: Type-specific fields hide when type changes
    Given a merchant who selected "Event" and filled in the start date
    When they change the type selector to "Service"
    Then the event date fields disappear
    And service-specific fields (duration, requires quote) appear
    And the previously entered event data is cleared

  Scenario: Image upload works inline
    Given a merchant on the listing form
    When they drag and drop 3 images onto the media dropzone
    Then thumbnails preview inline
    And images are uploaded to Firebase Storage
    And the mediaUrls array is populated on submit

  Scenario: Form validates before submit
    Given a merchant who clicks "Publish" without entering a title
    Then an inline validation error appears under the title field
    And the form does not submit
    And the error message reads "Title must be at least 3 characters"

  Scenario: Price input converts dollars to cents
    Given a merchant enters "$25.50" in the price field
    When the form submits
    Then basePrice is stored as 2550 (integer cents)
```

## 4. Component Specifications

| Component | Type | Description | Design System / Tailwind Classes |
|---|---|---|---|
| `UnifiedListingForm` | Client | Main form container replacing GoodForm/ServiceForm. Uses `react-hook-form` and Zod. | Form groups use `space-y-8`. Labels: `block text-sm font-medium text-slate-700 mb-1.5 font-inter`. Inputs: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`. Submit Button: `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. |
| `TypeSelector` | Client | 5 large pill buttons with emoji icons for selecting listing type. | Container: `flex flex-wrap gap-2 mb-8`. Pills: `rounded-full px-5 py-2.5 text-sm font-medium border border-slate-200 shadow-sm transition-all duration-200 ease-out active:scale-[0.98]`. Active state: `bg-indigo-50 text-indigo-700 border-indigo-300`. Inactive state: `bg-white text-slate-700 hover:bg-slate-50`. |
| `MediaDropzone` | Client | Drag-and-drop zone for inline image uploads. | Container: `rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50`. Thumbnails: `rounded-lg overflow-hidden shadow-sm`. |
| `app/admin/listings/new/page.js` | Server | Page wrapper for the UnifiedListingForm. | Container: `max-w-5xl mx-auto p-6 lg:p-10`. Header: `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug mb-8`. |