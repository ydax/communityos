# BLUEPRINT.md

**Last Updated:** 2023-10-26

## 1. Entities

| Entity | Collection | Description | Fields |
|---|---|---|---|
| User | `users` | Core identity record for all authenticated visitors. | `id` (string), `email` (string), `role` (enum: 'consumer', 'merchant', default: 'consumer'), `createdAt` (timestamp) |

## 2. State Machines

### Authentication & Role Flow
- **State: `logged_out`**
  - Event: `submit_email` -> Transition to `otp_pending`
- **State: `otp_pending`**
  - Event: `verify_otp_success` (role == 'consumer') -> Transition to `logged_in_consumer`
  - Event: `verify_otp_success` (role == 'merchant') -> Transition to `logged_in_merchant`
  - Event: `verify_otp_error` -> Transition to `otp_pending` (show error)
- **State: `logged_in_consumer`**
  - Event: `click_list_business` -> Transition to `merchant_upgrade_prompt`
  - Event: `complete_merchant_profile` -> Transition to `logged_in_merchant`
  - Event: `logout` -> Transition to `logged_out`
- **State: `logged_in_merchant`**
  - Event: `logout` -> Transition to `logged_out`

## 3. Gherkin Scenarios

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

| Component | Type | File | Description / Design System Tokens |
|---|---|---|---|
| `LoginForm` | UI | `app/login/page.js` | Mobile-first auth form. Uses glassmorphic card style: `bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm supports-[backdrop-filter]:bg-white/60`. Inputs use standard text input base (`block w-full rounded-lg border border-slate-200...`). Submit button uses Primary Button tokens (`bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]`). |
| `MarketplaceHeader` | UI | `components/MarketplaceHeader.js` | Sticky header: `sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl transition-all sm:px-6 lg:px-8`. Contains "List Your Business" CTA using Primary Button tokens. |
| `Middleware` | Logic | `middleware.js` | Intercepts requests to `/admin/*`. Checks user session and `role`. Redirects unauthenticated users to `/login` (saving original URL for post-login redirect). Redirects `consumer` role to "Become a Merchant" upgrade prompt. Allows `merchant` role through. |
| `Auth API` | API | `app/api/auth/resolve/route.js` & `session/route.js` | Handles OTP verification and session creation. Ensures `role` is fetched from Firestore `users` collection and embedded in the secure session cookie for middleware access. |