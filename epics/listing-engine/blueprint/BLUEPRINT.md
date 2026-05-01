# BLUEPRINT: Universal Listing Engine

*Last Updated: 2026-05-01*

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| **Listing** | Polymorphic document representing a marketplace item. Supports multiple types with shared base fields and type-specific details. | `id` (string)<br>`type` (enum: PRODUCT, EVENT, SERVICE, FOOD, COMMUNITY)<br>`title` (string)<br>`description` (string)<br>`basePrice` (integer, cents)<br>`images` (string[])<br>`tags` (string[])<br>`location` (string)<br>`details` (json map)<br>`variants` (array) |

## 2. State Machines

*(No state machines defined yet)*

## 3. Gherkin Scenarios

### Feature: Polymorphic Listing Schema

```gherkin
Feature: Polymorphic Listing Schema

  Scenario: Product listing validates correctly
    Given a listing payload with type "PRODUCT"
    And base fields: title, description, basePrice, images, tags
    And details: { fulfillment: ["PICKUP"], condition: "new" }
    When the schema validates the payload
    Then validation succeeds
    And the parsed output includes the details object

  Scenario: Event listing validates with required date fields
    Given a listing payload with type "EVENT"
    And details: { startTime: "2026-06-15T18:00:00Z", endTime: "2026-06-15T22:00:00Z", venueName: "The Pearl", isTicketed: true }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Event listing rejects missing startTime
    Given a listing payload with type "EVENT"
    And details: { venueName: "The Pearl" }
    When the schema validates the payload
    Then validation fails with error on details.startTime

  Scenario: Service listing validates lead-gen fields
    Given a listing payload with type "SERVICE"
    And details: { estimatedDurationMins: 60, requiresQuote: true, serviceArea: "San Marcos" }
    When the schema validates the payload
    Then validation succeeds

  Scenario: Base fields are enforced across all types
    Given a listing payload of any type missing the title field
    When the schema validates the payload
    Then validation fails with error on title

  Scenario: Prices are validated as integer cents
    Given a listing with basePrice: 75.50 (not an integer)
    When the schema validates the payload
    Then validation fails with "Price must be a whole number (in cents)"

  Scenario: Tags are free-form strings
    Given a listing with tags: ["vegan", "live-music", "family-friendly"]
    When the schema validates the payload
    Then validation succeeds
    And tags are preserved as-is

  Scenario: Variants array validates
    Given a listing with variants: [{ name: "VIP", priceDelta: 2500, inventoryCount: 50 }]
    When the schema validates the payload
    Then validation succeeds
    And each variant has an auto-generated id
```

## 4. Component Specifications

| Component Name | Description | Props / State | Design System Tokens |
|---|---|---|---|
| *(None yet)* | | | |
