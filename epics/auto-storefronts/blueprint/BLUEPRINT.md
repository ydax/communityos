# BLUEPRINT: Auto-Generated Merchant Storefronts

**Last Updated:** 2026-05-02

## 1. Entities

| Entity | Field | Type | Description |
|---|---|---|---|
| Site | `slug` | String | Unique URL identifier for the merchant storefront (e.g., `joes-bbq`). |
| Site | `name` | String | The business name of the merchant. |
| Site | `bio` | String | Optional. A short description of the business. |
| Site | `logoUrl` | String | Optional. URL to the merchant's logo image. |
| Site | `theme` | String | The selected visual theme (e.g., `TheMaker`, `TheTrade`, `TheVenue`). |

## 2. State Machines

*(No state machines required for current scope)*

## 3. Gherkin Scenarios

### Feature: Storefront SEO & OpenGraph

```gherkin
Feature: Storefront SEO & OpenGraph

  Scenario: Dynamic meta tags are generated
    Given a merchant "Joe's BBQ" with bio "Best brisket in San Marcos"
    When a search engine indexes /m/joes-bbq
    Then the <title> tag is "Joe's BBQ | CentralTexas.com"
    And the meta description is "Best brisket in San Marcos"
    And og:title is "Joe's BBQ"
    And og:description is "Best brisket in San Marcos"
    And og:url is "https://centraltexas.com/m/joes-bbq"

  Scenario: OpenGraph image uses merchant logo
    Given a merchant with a logoUrl set
    When their storefront link is shared on Instagram
    Then the link preview shows their logo as the og:image

  Scenario: Fallback meta for merchants without a bio
    Given a merchant who left the bio field empty
    Then the meta description defaults to "{Business Name} on CentralTexas.com — your local marketplace"

  Scenario: Canonical URL is set correctly
    Given a merchant storefront at /m/river-city-scapes
    Then the canonical URL meta tag points to https://centraltexas.com/m/river-city-scapes
```

## 4. Component Specifications

| Component | Type | Data/Props | Behavior & UI/UX Guidelines |
|---|---|---|---|
| `app/m/[slug]/page.js` | Server Component | `params.slug` | **Behavior:** Fetches the `Site` entity by slug. Exports a `generateMetadata` function that returns dynamic SEO tags. Sets `<title>` to `"{name} \| CentralTexas.com"`. Sets `description` to `bio` or fallback `"{name} on CentralTexas.com — your local marketplace"`. Sets `og:title`, `og:description`, `og:url` (`https://centraltexas.com/m/[slug]`), and `og:image` (using `logoUrl` if available, else fallback). Sets canonical URL. Also serves as the main page component for the storefront. |
| `app/layout.js` | Server Layout | `children` | **Behavior:** Exports a default `metadata` object containing the base title template, default description, and fallback OpenGraph image (branded CentralTexas.com image) for routes that do not override it. |