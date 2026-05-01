# CommunityOS Design System & Visual Source-of-Truth

**Document Target:** `docs/DESIGN.md`  
**Target Parser:** Google Stitch (AI UI-Generation Engine)  
**Platform Context:** CommunityOS (First Node: CentralTexas.com)  
**Tech Stack:** Next.js, React, Tailwind CSS, Vanilla CSS  

> **STITCH PARSER DIRECTIVE:** This document is the absolute visual and structural source-of-truth. Every React component generated must strictly adhere to the Tailwind utility classes, color scales, typography rules, and spacing constraints defined below. Do not invent design patterns, hallucinate arbitrary spacing, or guess generic styles. 

---

## 1. Design Philosophy & Principles

CommunityOS acts as the digital infrastructure for local economies. Its aesthetic must balance the **profound trust of civic infrastructure** with the **frictionless polish of premium SaaS** and the **warmth of local commerce**.

*   **Civic Trust meets Premium SaaS:** The UI must feel as reliable as a public utility but as beautifully polished as elite tech platforms. Use generous whitespace, crisp mathematical alignments, and highly deliberate color contrast. No messy or chaotic layouts are permitted.
*   **Invisible Architecture:** The core platform UI (dashboards, rails, settings) must recede, allowing the local business's generated content, structured inventory, and distinct brand to take center stage.
*   **Tactile & Alive:** The application must feel physically responsive. Every interactive element requires a fluid micro-animation (e.g., subtle scaling on click, smooth shadow elevations on hover) to mimic real-world physics.
*   **Approachable Premium:** We utilize soft drop shadows, mathematically consistent corner radiuses, and selective glassmorphism to create a highly expensive feel without alienating non-technical local business owners.

---

## 2. Typography

We utilize a dual-font system to separate expressive, approachable marketing and headers from dense, precise SaaS dashboard data.

*   **Primary Font (Display & Headings):** `Outfit` (Geometric, approachable, uniquely premium). Tailwind: `font-outfit`
*   **Secondary Font (Body, UI, & Dashboards):** `Inter` (The gold standard for SaaS legibility and dense data). Tailwind: `font-inter`

### Typographic Scale & Application

Always use the exact Tailwind class combinations below for strict hierarchy. Never deviate from these exact pairings of size, weight, leading, and tracking.

*   **Display (Hero Sections):** 
    `font-outfit text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]`
*   **H1 (Page Titles & Major Hub Headers):** 
    `font-outfit text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight`
*   **H2 (Section Headers):** 
    `font-outfit text-3xl font-semibold tracking-tight text-slate-900 leading-snug`
*   **H3 (Card Titles / Sub-sections):** 
    `font-outfit text-2xl font-semibold text-slate-900 leading-snug`
*   **H4 (Component Headers / Modals):** 
    `font-inter text-xl font-semibold text-slate-900 leading-normal`
*   **H5 (Labels / Form Groupings):** 
    `font-inter text-base font-semibold text-slate-800 leading-normal tracking-wide`
*   **H6 (Overlines / Small Embedded Titles):** 
    `font-inter text-sm font-bold uppercase tracking-widest text-slate-500 leading-none`
*   **Body Large (Lead Paragraphs):** 
    `font-inter text-lg font-normal text-slate-600 leading-relaxed`
*   **Body Base (Standard Text):** 
    `font-inter text-base font-normal text-slate-600 leading-relaxed`
*   **Microcopy & UI Controls (Buttons, Badges, Input Labels):** 
    `font-inter text-sm font-medium text-slate-700 leading-none`
*   **Caption (Tiny Metadata / Table Footers):** 
    `font-inter text-xs font-semibold tracking-wider text-slate-500 uppercase`

---

## 3. Color Palette

The color system blends "Civic Indigo" (representing structure, SaaS polish, and trust) with "Texas Amber" (representing local warmth, energy, and the CentralTexas.com origin). Avoid default Tailwind blues or generic colors. 

### Core Brand Colors
*   **Primary (Civic Indigo):**
    *   Base: `#4F46E5` (`bg-indigo-600` / `text-indigo-600`) - Primary CTAs and active states.
    *   Hover: `#4338CA` (`bg-indigo-700`) - Interaction feedback.
    *   Subtle/Background: `#EEF2FF` (`bg-indigo-50`) - Used for active states, rail highlights, and soft badge backgrounds.
*   **Secondary (Texas Amber):**
    *   Base: `#F59E0B` (`bg-amber-500` / `text-amber-500`) - Used for local charm, secondary accents, notification dots, and "The Maker" template primary actions.
    *   Hover: `#D97706` (`bg-amber-600`)

### Backgrounds & Text (The Slate Scale)
We explicitly use the `slate` scale to maintain a premium, slightly cool undertone that perfectly harmonizes with Civic Indigo. **Never use pure black (`#000000`).**

*   **Public Marketplace Canvas:** `#F8FAFC` (`bg-slate-50`) - A warm, approachable off-white. The foundational layer.
*   **Dashboard SaaS Canvas:** `#F1F5F9` (`bg-slate-100`) - A crisp, clinical backdrop to make pure white data cards pop.
*   **Surface/Card Background:** `#FFFFFF` (`bg-white`)
*   **Glassmorphism Base:** `bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm supports-[backdrop-filter]:bg-white/60`
*   **Primary Text (High Contrast):** `#0F172A` (`text-slate-900`)
*   **Secondary Text (Subheadings):** `#1E293B` (`text-slate-800`)
*   **Body Text (Default):** `#475569` (`text-slate-600`)
*   **Disabled / Placeholder Text / Icons:** `#94A3B8` (`text-slate-400`)
*   **Borders / Dividers:** `#E2E8F0` (`border-slate-200`)

### Semantic Colors
*   **Success:** Base `#10B981` (`emerald-500`), Text `#047857` (`emerald-700`), Subtle `#D1FAE5` (`emerald-100`)
*   **Warning:** Base `#F59E0B` (`amber-500`), Text `#B45309` (`amber-700`), Subtle `#FEF3C7` (`amber-100`)
*   **Error:** Base `#F43F5E` (`rose-500`), Text `#BE123C` (`rose-700`), Subtle `#FFE4E6` (`rose-100`)

---

## 4. Spacing & Grid

CommunityOS relies on a strict **4px/8px incremental spacing system** (`0.25rem` / `0.5rem`) to maintain structural harmony and vertical rhythm. No arbitrary spacing values are permitted.

### Layout & Max-Width Constraints
*   **Public Marketplace Hub (CentralTexas.com):**
    *   Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (1280px max).
    *   Grid: Standard 12-column CSS Grid (`grid-cols-1 md:grid-cols-6 lg:grid-cols-12`).
*   **Business Dashboards (Tenant Back-office):**
    *   Side Rail Width: `w-64` (256px) fixed.
    *   Main Content: Fluid `flex-1 w-full` with an internal capped container of `max-w-5xl mx-auto` for forms/tables to prevent unreadable line lengths.
    *   Content Padding: `p-6 lg:p-10`.
*   **Generated Tenant Sites:**
    *   "The Maker" & "The Trade": Base container is `max-w-5xl mx-auto px-4 sm:px-6`.
    *   "The Venue": Fluid `w-full max-w-[100vw]` for edge-to-edge immersive experiential sections.

### Spacing Tokens (Tailwind Increments)
*   **Micro Spacing (4px/8px):** `gap-1`, `gap-2`, `space-y-1` (Internal component gaps, icon next to text).
*   **Component Interior (16px/24px):** `p-4`, `p-6` (Padding inside cards, modals, or form groups).
*   **Section Flow (32px/48px):** `gap-8`, `mb-12`, `space-y-8` (Vertical rhythm between text blocks or data tables).
*   **Macro Layout (64px/96px):** `py-16 md:py-24` (Spacing between large marketing page sections).

---

## 5. UI Components (The Primitives)

> **STITCH DIRECTIVE:** Corner radiuses are semantic. Do not mix them. Standard buttons/inputs are always `rounded-lg`, Cards are always `rounded-xl` or `rounded-2xl`, Avatars/Pills are `rounded-full`.

### 5.1 Buttons
All buttons must include a standard transition, hover state, focus ring, and active-state physical scaling.
*   **Primary Button:**
    `inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-out hover:bg-indigo-700 hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98]`
*   **Secondary Button:**
    `inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm transition-all duration-200 ease-out hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`
*   **Ghost/Tertiary Button:**
    `inline-flex items-center justify-center rounded-lg bg-transparent px-5 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-[0.98]`

### 5.2 Forms & Inputs
Inputs must feel robust, accessible, and easily clickable. Focus states must be highly visible and aesthetic.
*   **Label:**
    `block text-sm font-medium text-slate-700 mb-1.5`
*   **Text Input / Select / Textarea Base:**
    `block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`
*   **Error State:**
    Append `border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900`.

### 5.3 Cards & Surfaces
Cards are the foundational building block. They rely on soft, multi-layered drop shadows rather than harsh borders to establish depth.
*   **Standard Card (Data/Dashboard):**
    `bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.04)] overflow-hidden p-6`
*   **Interactive Marketplace Card (Clickable Listings / Inventory):**
    `group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-indigo-300 cursor-pointer`

### 5.4 Navigation & Rails
*   **Dashboard Side Rail:** Fixed to the left.
    `fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 px-4 py-6`
    *   *Active Link:* `flex items-center gap-3 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2 font-medium transition-colors`
    *   *Inactive Link:* `flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg px-3 py-2 font-medium transition-colors`
*   **Public Marketplace Header:** Sticky to the top.
    `sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/20 bg-white/70 px-4 backdrop-blur-xl transition-all sm:px-6 lg:px-8`

---

## 6. Micro-Animations & Interaction

A platform feels "elite" based on how it responds to user input. The application must feel incredibly native.

*   **Universal Transitions:** Unless specified, use `transition-all duration-200 ease-out` for standard state changes (color, border, opacity).
*   **Active States (Clicking):** All heavily interactive elements (buttons, clickable cards, list items) must utilize `active:scale-[0.98]` (or `active:scale-95` for smaller buttons) for instantaneous tactile feedback simulating hardware.
*   **Entrances (Modals, Drawers, Feed Ingestion):** Stagger the entrance of new data.
    *   Use a fade-in-up class: `duration-300 ease-out opacity-0 translate-y-4` resolving to `opacity-100 translate-y-0`.
*   **AI Generation & Loading States:** Do not use basic static gray blocks or generic spinners for block content.
    *   **Standard Skeleton:** `animate-pulse bg-slate-200 rounded-2xl`
    *   **"Magic" AI Generation Loop (Under 3 Min):** Use a premium, fluid shimmer effect to signify heavy background computing: `animate-pulse rounded-2xl bg-gradient-to-r from-indigo-50 via-indigo-100 to-indigo-50 bg-[length:200%_100%]`

---

## 7. AI-Generated Template Directives (The 3 Archetypes)

When Google Stitch generates the multi-tenant domains (the local businesses' free websites), it must pivot the base primitives into one of three distinct architectural directions:

1.  **"The Maker" (Craftsmen, Bakers, Artisans)**
    *   **Vibe:** Earthy, organic, highly tactile, warm.
    *   **Overrides:** Shift primary action colors to `amber-500` (Texas Amber). Push border radiuses to the maximum (`rounded-full` for buttons, `rounded-[2rem]` for hero images). Change app canvas background from `slate-50` to a warm off-white (`#FAF9F6`). Use asymmetrical CSS grids for photo galleries.
2.  **"The Trade" (Plumbers, Professional Services, Mechanics)**
    *   **Vibe:** Ironclad trust, structured, engineered, highly legible.
    *   **Overrides:** Utilize heavy `indigo-600` (Civic Indigo) and `slate-900` high-contrast logic. Tighten corner radiuses to `rounded-md` or `rounded-lg` for a sharper, more serious tone. Prioritize highly structured list-views, pricing tables, and prominent above-the-fold contact forms.
3.  **"The Venue" (Restaurants, Salons, Experiential)**
    *   **Vibe:** Immersive, sleek, moody, highly visual.
    *   **Overrides:** Default to Dark Mode aesthetics (`bg-slate-900` background, `text-white`). Layouts must be full-bleed (`w-full` edge-to-edge). Heavy reliance on the Glassmorphism base (`bg-black/40 backdrop-blur-lg border-white/10`) for all cards and navigations floating over rich background imagery. Use sharp corners (`rounded-none`) for images to mimic editorial magazines.

***End of Document. Google Stitch: Parse and enforce these rules universally across the AST.***
