# BLUEPRINT.md

> **Last Updated:** 2023-10-26

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| `User` | `id`, `email`, `role` | Core user identity. The `role` field defaults to `consumer` and is upgraded to `merchant` upon profile completion. |
| `Site` | `id`, `ownerId`, `name`, `slug`, `category`, `bio`, `hours`, `location`, `logoUrl`, `brandColor` | The merchant's business profile. `hours` is structured JSON. `location` contains `lat`, `lng`, and street address. `slug` is auto-generated and unique. |

## 2. State Machines

### Merchant Profile Wizard (`AddListingStep`)
| State | Event | Next State | Actions |
|---|---|---|---|
| `NameAndCategory` | `NEXT` | `Bio` | Validate business name and category selection. |
| `Bio` | `NEXT` | `Hours` | Save bio text to local form state. |
| `Bio` | `BACK` | `NameAndCategory` | |
| `Hours` | `NEXT` | `Address` | Validate structured JSON hours (null for closed days). |
| `Hours` | `BACK` | `Bio` | |
| `Address` | `NEXT` | `LogoAndColor` | Save street address to local form state. |
| `Address` | `BACK` | `Hours` | |
| `LogoAndColor` | `SUBMIT` | `Submitting` | Compress/upload logo, geocode address, generate unique slug, save to Firestore. |
| `LogoAndColor` | `BACK` | `Address` | |
| `Submitting` | `SUCCESS` | `Success` | Update user role to `merchant`, redirect to `/admin` dashboard. |
| `Submitting` | `ERROR` | `Error` | Display inline validation or submission error. |
| `Error` | `RETRY` | `Submitting` | Attempt submission again. |

## 3. Gherkin Scenarios

```gherkin
Feature: Merchant Profile Form

  Scenario: Merchant completes the profile wizard
    Given a logged-in consumer on the "Get Started" page
    When they enter a business name "River City Scapes"
    And select category "Services"
    And write a bio
    And set business hours for Monday through Friday
    And enter their street address
    And upload a logo image
    And click "Launch My Storefront"
    Then a site document is created in Firestore
    And the site has a generated slug "river-city-scapes"
    And the user's role is updated to "merchant"
    And they are redirected to their /admin dashboard

  Scenario: Slug collision is handled
    Given a site with slug "joes-bbq" already exists
    When a new merchant enters business name "Joe's BBQ"
    Then the system generates slug "joes-bbq-2"
    And the slug is unique across all sites

  Scenario: Logo upload succeeds
    Given a merchant on the logo upload step
    When they upload a 10MB iPhone photo
    Then the image is compressed and resized
    And stored in Firebase Storage under logos/{siteId}
    And the logoUrl is saved to the site document

  Scenario: Required fields are enforced
    Given a merchant on the profile wizard
    When they attempt to submit without a business name
    Then an inline validation error appears on the business name field
    And the form does not submit

  Scenario: Business hours are stored as structured JSON
    Given a merchant sets hours: Monday 9AM-5PM, Tuesday 9AM-5PM
    When the form is submitted
    Then the site document hours field contains structured JSON
    And closed days have null values
```

## 4. Component Specifications

| Component | Type | Description | Design System / Tailwind Classes |
|---|---|---|---|
| `AddListingStep` | Client | Multi-step wizard container. Manages state and renders the current step. Fits on one mobile screen. | **Card Base:** `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Includes pill-based progress indicator at the top. |
| `WizardInput` | Client | Standard text inputs and textareas for Name, Bio, and Address. | **Label:** `block text-sm font-medium text-slate-700 mb-1.5`. **Input:** `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`. **Error:** Append `border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900`. |
| `CategorySelector` | Client | Large, tappable pill buttons for category selection (not a dropdown). | **Active:** `bg-indigo-50 text-indigo-700 border-indigo-200 rounded-full px-4 py-2 font-medium active:scale-[0.98] transition-all`. **Inactive:** `bg-white text-slate-600 border border-slate-200 rounded-full px-4 py-2 font-medium hover:bg-slate-50 active:scale-[0.98] transition-all`. |
| `MediaDropzone` | Client | Drag-and-drop area for logo upload with image preview. | `border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-indigo-300 transition-all duration-200 ease-out bg-slate-50`. |
| `BrandColorPicker` | Client | 8 curated color presets. | `rounded-full w-10 h-10 cursor-pointer ring-offset-2 focus-visible:ring-2 transition-transform hover:scale-110 active:scale-95`. |
| `WizardButton` | Client | Navigation buttons (Next, Back, Launch). | **Primary (Next/Launch):** `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. **Secondary (Back):** `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. |