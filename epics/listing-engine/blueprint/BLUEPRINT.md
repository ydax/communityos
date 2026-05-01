# BLUEPRINT.md

**Last Updated:** 2023-10-24

## Epic: Universal Listing Engine

### 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Listing` | Base polymorphic document for all listing types. | `id` (string), `type` (enum), `title` (string), `description` (string), `basePrice` (integer, cents), `variants` (array of Variant), `details` (JSON map) |
| `Variant` | Flat tuple representing a purchasable option for a listing. | `name` (string), `priceDelta` (integer, cents), `inventoryCount` (integer \| null) |

### 2. State Machines

#### Variant Management State Machine
| State | Event | Next State | Actions/Conditions |
|---|---|---|---|
| `idle` | `ADD_VARIANT_CLICKED` | `adding_variant` | Condition: `variants.length < 10` |
| `idle` | `ADD_VARIANT_CLICKED` | `max_variants_error` | Condition: `variants.length >= 10` |
| `adding_variant` | `SAVE_VARIANT` | `idle` | Action: Append new variant to `variants` array |
| `adding_variant` | `CANCEL` | `idle` | Action: Clear form fields |
| `idle` | `DELETE_VARIANT` | `idle` | Action: Remove variant from array, re-index remaining variants |

### 3. Gherkin Scenarios

#### Feature: Variant Management

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

### 4. Component Specifications

| Component | Description | Styling / Design System Tokens |
|---|---|---|
| `VariantEditor.js` | Container component managing the variant state array and rendering the table and form. | Container: `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] p-6 space-y-8`. Header: `font-inter text-xl font-semibold text-slate-900 leading-normal`. |
| `VariantTable.js` | Compact table layout displaying existing variants. Stacks vertically on mobile. | Layout: `w-full flex flex-col md:table text-sm text-slate-600 gap-4 md:gap-0`. Headers: `font-inter text-xs font-semibold tracking-wider text-slate-500 uppercase`. Delete Button: `text-slate-400 hover:text-rose-500 transition-colors duration-200 active:scale-[0.98]`. |
| `VariantForm.js` | Form to input Name, Price Adjustment, and Stock. | Labels: `block text-sm font-medium text-slate-700 mb-1.5`. Inputs: `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20`. Add Button: `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`. |