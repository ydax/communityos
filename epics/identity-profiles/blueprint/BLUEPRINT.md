# BLUEPRINT.md

## 1. Entities

| Entity | Fields | Description |
|---|---|---|
| `User` | `uid` (string), `email` (string), `displayName` (string), `role` (string, default: "consumer"), `preferredCity` (string, nullable), `createdAt` (timestamp) | Core user identity document stored in Firestore. Represents the lightweight consumer profile. |
| `Site` | `bio` (string), `hours` (json), `location.lat` (number, nullable), `location.lng` (number, nullable), `location.city` (string), `location.formattedAddress` (string), `logoUrl` (string) | Merchant profile document stored in the sites collection. Contains business details and geocoded location data. |

## 2. State Machines

| Component | States | Transitions | Description |
|---|---|---|---|
| `CitySelector` | `idle`, `selecting`, `saving`, `error` | `idle` -> `selecting` (click dropdown) <br> `selecting` -> `saving` (choose city) <br> `saving` -> `idle` (success) <br> `saving` -> `error` (failure) | Manages the state of the preferred city dropdown in the marketplace header. |

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

## 4. Component Specifications

| Component | File Path | Visual/Styling Rules (Tailwind) | Behavioral/Data Rules |
|---|---|---|---|
| `MarketplaceHeader` | `components/layout/MarketplaceHeader.js` | `sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl transition-all sm:px-6 lg:px-8` | Renders the top navigation for the marketplace. Houses the `CitySelector` component. |
| `CitySelector` | `components/discovery/CitySelector.js` | Dropdown trigger uses Secondary Button styles: `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`. Font: `font-inter`. | Fetches current `preferredCity` from user doc. On change, updates `usersService.js` and triggers marketplace re-filter. MVP Cities: Austin, San Marcos, Kyle, Buda, New Braunfels, San Antonio. |

*Last Updated: 2024-05-26*