# BLUEPRINT.md

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| `User` | `uid` (string), `email` (string), `displayName` (string), `role` (string, default: "consumer"), `preferredCity` (string, nullable), `createdAt` (timestamp) | Core user identity document stored in Firestore. Represents the lightweight consumer profile. |
| `Site` | `name` (string), `slug` (string), `category` (string), `brandColor` (string), `bio` (string), `hours` (json), `location.lat` (number, nullable), `location.lng` (number, nullable), `location.city` (string), `location.formattedAddress` (string), `logoUrl` (string) | Merchant profile document stored in the sites collection. Contains business details, branding, and geocoded location data. |

## 2. State Machines

| Component | States | Transitions | Description |
|---|---|---|---|
| `CitySelector` | `idle`, `selecting`, `saving`, `error` | `idle` -> `selecting` (click dropdown) <br> `selecting` -> `saving` (choose city) <br> `saving` -> `idle` (success) <br> `saving` -> `error` (failure) | Manages the state of the preferred city dropdown in the marketplace header. |
| `MerchantProfileWizard` | `step_name`, `step_bio`, `step_hours`, `step_address`, `step_logo`, `submitting`, `success`, `error` | `step_name` -> `step_bio` (next) <br> `step_bio` -> `step_hours` (next) <br> `step_hours` -> `step_address` (next) <br> `step_address` -> `step_logo` (next) <br> `step_logo` -> `submitting` (submit) <br> `submitting` -> `success` (saved) <br> `submitting` -> `error` (failure) | Manages the multi-step onboarding flow for merchants to create their profile. |
| `LoginForm` | `idle`, `submitting_email`, `verifying_otp`, `success`, `error` | `idle` -> `submitting_email` (submit) <br> `submitting_email` -> `verifying_otp` (OTP sent) <br> `verifying_otp` -> `success` (OTP valid) <br> `verifying_otp` -> `error` (OTP invalid) <br> `submitting_email` -> `error` (network error) | Manages the OTP authentication UI state. |

## 3. Gherkin Scenarios

### Feature: Consumer Identity & Preferences

```gherkin
Feature: Consumer Identity & Preferences

  Scenario: Consumer profile is auto-created on first login
    Given a new user completes OTP verification
    When they are redirected to the marketplace
    Then a user document exists in Firestore with role "consumer"
    And displayName is set from the email prefix
    And preferredCity defaults to null

  Scenario: Consumer sets their preferred city
    Given a logged-in consumer on the marketplace
    When they click the location selector in the header
    And choose "San Marcos" from the city list
    Then preferredCity is saved to their user document
    And the marketplace re-filters to show San Marcos listings first

  Scenario: Consumer profile is minimal
    Given a consumer user document
    Then it contains only: uid, email, displayName, role, preferredCity, createdAt
    And it does NOT contain merchant-specific fields like hours or bio
```

### Feature: Server-Side Address Geocoding

```gherkin
Feature: Server-Side Address Geocoding

  Scenario: Address is geocoded on profile save
    Given a merchant submits their profile with address "123 Main St, San Marcos, TX"
    When the site document is created in Firestore
    Then the server calls the Google Maps Geocoding API
    And saves location.lat and location.lng to the site document
    And saves location.city as "San Marcos"
    And saves location.formattedAddress as the API-returned formatted string

  Scenario: Geocoding fails gracefully
    Given a merchant submits an unrecognizable address "asdfghjkl"
    When the Geocoding API returns zero results
    Then the site document is still created
    And location.lat and location.lng are set to null
    And a warning is logged
    And the merchant sees a soft prompt: "We couldn't find that address. You can update it later."

  Scenario: Address is re-geocoded on update
    Given a merchant updates their address from "123 Main St" to "456 Elm St"
    When the site document is updated
    Then the server re-geocodes the new address
    And overwrites location.lat and location.lng with new values
```

### Feature: Merchant Profile Form

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

### Feature: Role-Based Authentication

```gherkin
Feature: Role-Based Authentication

  Scenario: New user signs up as a consumer
    Given a visitor on the login page
    When they enter their email and complete OTP verification
    Then a user document is created in Firestore with role "consumer"
    And they are redirected to the marketplace homepage

  Scenario: Consumer upgrades to merchant
    Given a logged-in consumer
    When they click "List Your Business" from the marketplace header
    Then they are redirected to the merchant profile form
    And completing the profile sets their role to "merchant"
    And they gain access to the /admin dashboard

  Scenario: Existing merchant logs in
    Given a user with role "merchant"
    When they log in successfully
    Then they are redirected to the /admin dashboard

  Scenario: Consumer attempts to access merchant dashboard
    Given a logged-in consumer
    When they navigate to /admin
    Then the middleware redirects them to the "Become a Merchant" page
    And they see a prompt to complete their merchant profile

  Scenario: Unauthenticated user attempts protected route
    Given a visitor who is not logged in
    When they navigate to /admin or /admin/listings
    Then they are redirected to the login page
    And after login they return to the originally requested route
```

## 4. Component Specifications

| Component | File Path | Visual/Styling Rules (Tailwind) | Behavioral/Data Rules |
|---|---|---|---|
| `MarketplaceHeader` | `components/layout/MarketplaceHeader.js` | `sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl transition-all sm:px-6 lg:px-8`. Includes "List Your Business" CTA using Primary Button: `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. | Renders the top navigation for the marketplace. Houses the `CitySelector` component and "List Your Business" CTA which redirects consumers to the merchant profile form. |
| `CitySelector` | `components/discovery/CitySelector.js` | Dropdown trigger uses Secondary Button styles: `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. Font: `font-inter`. | Fetches current `preferredCity` from user doc. On change, updates `usersService.js` and triggers marketplace re-filter. MVP Cities: Austin, San Marcos, Kyle, Buda, New Braunfels, San Antonio. |
| `MerchantProfileWizard` | `app/get-started/page.js` | Multi-step wizard with pill progress indicators. Each step uses Standard Card: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`. Category selection uses large pill buttons (`rounded-full` secondary button styles). Brand color picker offers 8 curated presets. Primary CTA uses: `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`. | Manages multi-step state. Validates required fields (e.g., business name). On submit, calls `sitesService.js` to create site, generates unique slug with collision detection, updates user role to `merchant` via `usersService.js`, and redirects to `/admin`. |
| `MediaDropzone` | `components/listings/MediaDropzone.js` | Drag-and-drop area with preview. Uses standard focus rings (`focus-visible:ring-2 focus-visible:ring-indigo-500`) and hover states. | Compresses and resizes image. Uploads to Firebase Storage under `logos/{siteId}` using `lib/utils/uploadImage.js`. Returns `logoUrl` to the parent wizard form. |
| `LoginForm` | `app/login/page.js` | Uses Glassmorphism Base for the auth card: `bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm supports-[backdrop-filter]:bg-white/60 rounded-2xl p-6`. Mobile-first responsive container. Inputs use standard text input base. | Manages OTP authentication flow. Calls `app/api/auth/resolve/route.js`. On success, redirects to marketplace homepage or originally requested protected route. |
| `AuthMiddleware` | `middleware.js` | N/A | Gates `/admin/*` routes. Checks session and `role` field. Redirects unauthenticated users to `/login`. Redirects `consumer` users to the merchant upgrade prompt. Allows `merchant` users through. |

*Last Updated: 2024-05-01*