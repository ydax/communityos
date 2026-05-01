# BLUEPRINT: Marketplace Discovery Engine

**Last Updated:** 2023-10-24

## 1. Entities

| Entity | Type | Description | Fields |
|---|---|---|---|
| `Listing` | Firestore Document | A product, service, or event offered by a merchant. | `id`, `siteId`, `title`, `description`, `type`, `basePrice`, `tags`, `images`, `status`, `createdAt` |
| `Site` | Firestore Document | The parent merchant site containing location and branding. | `id`, `merchantName`, `city`, `lat`, `lng` |
| `SearchIndexDocument` | Typesense Document | Denormalized listing optimized for search and geo-queries. | `id`, `title`, `description`, `type`, `basePrice`, `tags`, `images`, `merchantName`, `city`, `location` ([lat, lng]), `createdAt` |

## 2. State Machines

*(No stateful UI elements defined in the current scope)*

## 3. Gherkin Scenarios

### Feature: Search Index Sync

```gherkin
Feature: Search Index Sync

  Scenario: New listing is indexed on creation
    Given a merchant creates a new active listing "Handmade Candle"
    When the Firestore write triggers the Cloud Function
    Then a search document is upserted to the search index
    And the document includes: title, description, type, basePrice, tags, images[0]
    And the document includes denormalized: merchantName, city, lat, lng

  Scenario: Listing update re-indexes
    Given an indexed listing "Handmade Candle"
    When the merchant updates the price from $25 to $30
    Then the search document is updated with the new basePrice

  Scenario: Archived listing is removed from index
    Given an indexed listing "Handmade Candle"
    When the merchant archives the listing (status → "archived")
    Then the search document is deleted from the index

  Scenario: Draft listings are not indexed
    Given a merchant creates a listing with status "draft"
    Then no search document is created in the index

  Scenario: Deleted site removes all listings from index
    Given a merchant with 5 indexed listings
    When their site document is deleted
    Then all 5 listing documents are removed from the search index

  Scenario: Function handles missing site gracefully
    Given a listing with a siteId that no longer exists
    When the Cloud Function attempts to denormalize
    Then the function logs a warning and skips indexing
    And no error is thrown
```

## 4. Component Specifications

| Component | Type | Description | Props/State | Tailwind/Design Tokens |
|---|---|---|---|---|
| *(No UI components defined)* | | | | |

## 5. Backend Services & Functions

| Service/Function | File | Description | Triggers / Dependencies |
|---|---|---|---|
| `onListingWritten` | `functions/index.js` | Syncs Firestore listing changes to Typesense search index. Flattens listing data and denormalizes site data. | Trigger: `onDocumentWritten` on `listings/{listingId}`. Deps: `typesense`, `sitesService` |
| `onSiteDeleted` | `functions/index.js` | Removes all associated listings from the search index when a site is deleted. | Trigger: `onDocumentDeleted` on `sites/{siteId}`. Deps: `typesense` |