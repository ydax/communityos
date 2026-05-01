# BLUEPRINT.md
**Last Updated:** 2023-10-26

## 1. Entities

| Entity | Description | Fields |
|---|---|---|
| `Site` | Represents a merchant's storefront configuration and data. | `id` (String), `merchantId` (String), `slug` (String), `theme` (Enum: 'maker', 'trade', 'venue', default: 'trade'), `name` (String), `bio` (String), `logoUrl` (String) |

## 2. State Machines

### ThemeSelector State Machine
Manages the state of the theme selection UI in the merchant dashboard.
*   **States:** `idle`, `selecting`, `saving`, `saved`, `error`
*   **Events:**
    *   `SELECT_THEME`: Transitions from `idle`/`saved`/`error` to `selecting`. Updates local preview state.
    *   `SAVE`: Transitions to `saving`. Triggers Firestore update.
    *   `SAVE_SUCCESS`: Transitions to `saved`.
    *   `SAVE_ERROR`: Transitions to `error`.

## 3. Gherkin Scenarios

```gherkin
Feature: Storefront Theme Selection

  Scenario: Merchant selects a theme
    Given a merchant on their dashboard settings page
    When they view the Theme Selector
    Then they see three theme previews: "The Maker", "The Trade", "The Venue"
    And clicking one highlights it as selected

  Scenario: Theme is saved to Firestore
    Given a merchant selects "The Venue"
    When they click "Save"
    Then the site document's theme field is updated to "venue"
    And their public storefront re-renders with The Venue theme

  Scenario: Default theme is applied
    Given a new merchant who hasn't selected a theme
    Then their storefront renders with "The Trade" as the default theme

  Scenario: Theme changes are reflected immediately
    Given a merchant previewing their storefront in the dashboard
    When they switch from "The Trade" to "The Maker"
    Then the preview updates in real-time without a page reload
```

## 4. Component Specifications

| Component | Type | Description | Props / State | Tailwind / Design Tokens |
|---|---|---|---|---|
| `ThemeSelector` | Visual & Behavioral | Renders three large clickable preview cards for theme selection. Handles real-time preview updates and saves selection to Firestore. | **Props:** `currentTheme`, `onThemeChange`, `onSave`<br>**State:** `selectedTheme`, `isSaving` | Cards: `bg-white rounded-2xl border border-slate-200 p-6 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)]`. Active state: `ring-2 ring-indigo-500 border-indigo-500`. Includes check mark icon. |
| `SiteRenderer` | Structural | Dispatches to the correct theme component based on the site's `theme` field. Defaults to `TheTrade` if none is set. | **Props:** `siteData`, `listingsData` | N/A (Logic only) |
| `TheMaker` | Visual | Earthy, organic, warm theme archetype for craftsmen and artisans. | **Props:** `siteData`, `listingsData` | Primary action: `bg-amber-500 text-white`. Radiuses: `rounded-full` (buttons), `rounded-[2rem]` (hero images). Background: `bg-[#FAF9F6]`. Layout: Asymmetrical CSS grids. |
| `TheTrade` | Visual | Ironclad trust, structured, engineered theme archetype for professional services. | **Props:** `siteData`, `listingsData` | Primary action: `bg-indigo-600 text-white`. Radiuses: `rounded-md` or `rounded-lg`. Background: `bg-slate-50`. Text: `text-slate-900`. Layout: Highly structured list-views. |
| `TheVenue` | Visual | Immersive, sleek, moody theme archetype for restaurants and experiential businesses. | **Props:** `siteData`, `listingsData` | Dark mode: `bg-slate-900 text-white`. Layout: Full-bleed `w-full`. Glassmorphism: `bg-black/40 backdrop-blur-lg border-white/10`. Radiuses: `rounded-none` for images. |