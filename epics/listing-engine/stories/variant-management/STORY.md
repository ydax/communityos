---
id: story-variant-management
epic: epic-listing-engine
title: Variant Management for Products & Tickets
status: ready
priority: P1
persona: merchant
points: 3
depends_on:
  - story-unified-listing-form
blocked_by: []
services_affected:
  - components/listings/VariantForm.js
  - components/listings/VariantEditor.js
  - components/listings/VariantTable.js
  - lib/validations/listingSchema.js
experimental: false
created_at: 2026-05-01
---

# Story: Variant Management for Products & Tickets

## User Story

**As a** merchant with a product in multiple sizes or an event with ticket tiers,
**I want** to add, edit, and remove variants with price adjustments and inventory limits,
**So that** consumers can select the right option at checkout.

## Context

Variants live as a flat array on the listing document (not a subcollection).
Each variant has a name, price delta (added to basePrice), and optional
inventory count. The existing v2 `VariantEditor` and `VariantTable`
components handle the UI — this story adapts them for the v3 polymorphic
schema.

For the MVP, variants are simple name + price + inventory tuples. There
is no option matrix (e.g., Color × Size). A "Large Red T-Shirt" is one
variant, not a combination of two options.

## Acceptance Criteria

```gherkin
Feature: Variant Management

  Scenario: Merchant adds variants to a product
    Given a merchant editing a product listing
    When they click "Add Variant"
    Then a new variant row appears with fields: Name, Price Adjustment, Stock
    And they enter: Name "Large", Price Adjustment "+$5.00", Stock "20"
    And saving the listing includes the variant in the variants array

  Scenario: Variant price is calculated correctly
    Given a listing with basePrice 2500 (i.e., $25.00)
    And a variant with priceDelta 500
    Then the displayed variant price is "$30.00"

  Scenario: Variant with unlimited inventory
    Given a merchant adding a variant for a digital product
    When they leave the Stock field empty
    Then inventoryCount is saved as null (unlimited)

  Scenario: Merchant removes a variant
    Given a listing with 3 variants
    When the merchant clicks the delete icon on variant 2
    Then variant 2 is removed from the array
    And the remaining variants are re-indexed

  Scenario: Maximum 10 variants enforced
    Given a listing with 10 variants
    When the merchant clicks "Add Variant"
    Then the button is disabled
    And a message reads "Maximum 10 variants per listing"
```

## Design Notes

- Variant rows use a compact table layout (reuse `VariantTable.js`)
- Price adjustment input shows "+$" prefix
- Delete button is a subtle trash icon, right-aligned
- On mobile, variant rows stack vertically instead of table columns

## Out of Scope

- Option matrix (Color × Size cross-product)
- Variant-specific images
- SKU auto-generation
- Inventory tracking or stock alerts

## Implementation Reference

- Variant UI: `components/listings/VariantForm.js`, `VariantEditor.js`, `VariantTable.js`
- Schema: `lib/validations/listingSchema.js` (variant sub-schema)

 
