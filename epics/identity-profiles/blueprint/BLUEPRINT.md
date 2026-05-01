# BLUEPRINT.md

**Last Updated:** 2026-05-01

## Entities

| Entity | Fields | Description |
|---|---|---|
| **User** | `id`, `email`, `role` (String: 'consumer' \| 'merchant') | Core user record. Starts as 'consumer', upgrades to 'merchant' upon profile completion. |
| **Site** | `id`, `ownerId`, `name`, `bio`, `hours` (JSON), `location` (JSON: lat, lng, city, formattedAddress), `logoUrl` | Merchant profile. `hours` stored as `{ mon: { open: "09:00", close: "17:00" }... }`. `location` populated via server-side geocoding. |

## State Machines

*(No state machines defined yet)*

## Gherkin Scenarios

### Epic: Identity & Merchant Profiles

#### Feature: Server-Side Address Geocoding

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

## Component Specifications

| Component | Type | State/Props | Tailwind Classes | Notes |
|---|---|---|---|---|
| *(None)* | | | | No UI components introduced in current scope. |
