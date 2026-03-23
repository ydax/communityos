# Phase 6: Website Owner Dashboard

**Project:** CivicOS (Node 1: CentralTexas.com)
**Phase:** 6 — Website Owner Dashboard
**Status:** 🔲 Planning Complete — Ready to Build
**Date:** March 23, 2026

---

## 🎯 Objective

Build the **self-service Website Owner Dashboard** so local business tenants can log in and independently manage their own listings, variants, inventory, orders, sales analytics, and Stripe payouts.

---

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph Edge ["Vercel Edge (middleware.js)"]
        AuthGuard["Auth Guard: /dashboard/* routes"]
    end

    subgraph Dashboard ["app/(dashboard)/dashboard/"]
        Layout["layout.js — TenantProvider Shell"]
        Analytics["page.js — Analytics Overview"]
        Listings["listings/ — Square-Model Catalog"]
        Orders["orders/ — Order History & Fulfillment"]
        Settings["settings/ — Site Config & Payouts"]
    end

    subgraph Backend ["Server Layer"]
        Session["api/auth/session — Cookie Exchange"]
        StripeConnect["api/stripe/connect — Onboarding Links"]
        StripeWebhook["api/stripe/webhook — account.updated"]
        ServerActions["Server Actions — Scoped Mutations"]
    end

    subgraph Firebase ["Firestore"]
        Sites["sites/{siteId} + ownerId"]
        Listings_DB["listings/{listingId} + ownerId"]
        Variants_DB["variants/{variantId} + ownerId"]
        Orders_DB["orders/{orderId} + siteId"]
        AnalyticsDoc["analytics/{siteId} — Pre-Aggregated"]
    end

    AuthGuard --> Layout
    Layout --> Analytics
    Layout --> Listings
    Layout --> Orders
    Layout --> Settings

    Settings --> StripeConnect
    StripeWebhook --> Sites

    ServerActions --> Listings_DB
    ServerActions --> Variants_DB
    ServerActions --> Orders_DB

    Analytics --> AnalyticsDoc
```

---

## 🔐 Security Model (Three-Layer Enforcement)

### Layer 1: Edge Middleware
Requests to `/dashboard/*` must have a valid session cookie.

### Layer 2: Server Actions & API Routes
Extract `ownerId` from session cookie and validate against target document `ownerId`.

### Layer 3: Firestore Security Rules
Denormalized `ownerId` on every child document enables zero-lookup rules.

---

## 🗓️ Implementation Phases

### Phase 6.1: Security Foundation & Dashboard Shell
1. **Session API:** Exchange Firebase ID token → HTTP-only cookie.
2. **Login Page:** Firebase Auth UI + session setup.
3. **Middleware Guard:** Protect `/dashboard/*`.
4. **Tenant Context:** `TenantProvider` + sidebar shell.
5. **Data Migration:** Run script to denormalize `ownerId` onto existing listings/variants.
6. **Firestore Rules:** Deploy owner-scoped rules.

### Phase 6.2: Catalog & Inventory Engine
7. **Listings Grid:** Scoped fetch by `ownerId`.
8. **Polymorphic Editor:** Services vs. Goods UI.
9. **Atomic Inventory:** Batch-writes for SKUs and `increment()` ops.
10. **MagicBox:** Voice/Camera listing creation in-dashboard.

### Phase 6.3: Stripe Connect & Payouts
11. **Connect API:** Generate Express onboarding links.
12. **Webhook Handler:** Listen for `account.updated`.
13. **Payouts Page:** Connection status & Stripe dashboard link.
14. **Destination Charges:** Split payments (10% platform fee) on checkout.

### Phase 6.4: Orders & Analytics
15. **Order History:** Fulfillment tracking per site.
16. **Pre-Aggregated Analytics:** Cloud Function to sum GMV into `analytics/{siteId}`.
17. **Dashboard Overview:** Snapshots of revenue and top-performing items.
