# CentralTexas.com: Technical Architecture

**Last Updated:** February 4, 2026  
**Status:** Phase 1 - Foundation (Documentation)  
**Related:** [`CENTRAL_TEXAS_CONTEXT.md`](CENTRAL_TEXAS_CONTEXT.md) | [`4-central-texas.md`](../projects/4-central-texas.md)

---

## 📋 Quick Reference

| Component        | Technology                              | Purpose                                        |
| ---------------- | --------------------------------------- | ---------------------------------------------- |
| **Frontend**     | Next.js 15+ (App Router)                | Multi-tenant web application                   |
| **Hosting**      | Vercel                                  | Primary hosting with edge middleware           |
| **Backend**      | Firebase (Firestore + Auth + Functions) | Database, authentication, serverless functions |
| **Language**     | JavaScript (ES6+)                       | **NO TypeScript**                              |
| **UI Framework** | Material UI v4 + Tailwind CSS           | Component library + styling                    |
| **Payments**     | Stripe Connect Express                  | Payment processing with splits                 |
| **Testing**      | Cypress/Playwright + Vitest             | E2E and unit testing                           |
| **CI/CD**        | GitHub Actions                          | Automated deployment pipeline                  |

---

## 🏗️ System Architecture

### High-Level Overview

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer"]
        Browser[User Browser]
    end

    subgraph VercelEdge ["Vercel Edge Network"]
        Middleware[Multi-Tenant Middleware]
        NextApp[Next.js App Router]
    end

    subgraph FirebaseBackend ["Firebase Backend"]
        Firestore[(Firestore DB)]
        Auth[Firebase Auth]
        Functions[Cloud Functions]
        Storage[Cloud Storage]
    end

    subgraph ExternalServices ["External Services"]
        Stripe[Stripe Connect]
        DNS[Custom Domains]
    end

    Browser -->|HTTPS Request| Middleware
    Middleware -->|Domain Lookup| Firestore
    Middleware -->|Route to Site| NextApp
    NextApp -->|Read/Write Data| Firestore
    NextApp -->|Authenticate| Auth
    Functions -->|Process Payments| Stripe
    Functions -->|Webhooks| NextApp
    NextApp -->|Upload Images| Storage
    DNS -->|SSL/TLS| Middleware
```

### Multi-Tenant Architecture

The platform uses **middleware-based domain routing** inspired by the Vercel Platforms Starter Kit:

1. **Request Interception:** Middleware intercepts all incoming requests
2. **Domain Extraction:** Extract hostname from request (e.g., `joesfencing.com`)
3. **Site Lookup:** Query Firestore for site configuration by domain
4. **Dynamic Routing:** Route to appropriate site template with site data
5. **SSL/TLS:** Vercel automatically provisions wildcard SSL certificates

**Key Pattern:** One Next.js app serves unlimited custom domains dynamically.

---

## 📁 Project Structure

### Monorepo Layout

```
davis/
├── app/                        # Existing voter registration app (Firebase Hosting)
│   ├── pages/                  # Next.js Pages Router
│   ├── components/             # Material UI v4 components
│   ├── public/                 # Static assets
│   └── package.json
│
├── centraltexas/               # NEW: CentralTexas.com app (Vercel)
│   ├── app/                    # Next.js App Router (v15+)
│   │   ├── (marketing)/        # Marketing site routes
│   │   ├── (sites)/            # Multi-tenant site routes
│   │   ├── admin/              # Internal admin tools
│   │   ├── api/                # API routes
│   │   └── middleware.js       # Multi-tenant routing logic
│   │
│   ├── components/             # React components
│   │   ├── editor/             # Site editor components
│   │   ├── listings/           # Listing manager components
│   │   └── ui/                 # Shared UI components
│   │
│   ├── lib/                    # Core utilities and services
│   │   ├── firebase/           # Firebase client configuration
│   │   ├── dbServices/         # Firestore CRUD modules
│   │   ├── apiServices/        # External API clients
│   │   └── utils/              # Generic utilities
│   │
│   ├── public/                 # Static assets
│   ├── styles/                 # Global styles and themes
│   ├── .env.local              # Local environment variables
│   ├── middleware.js           # Root middleware (domain routing)
│   ├── next.config.js          # Next.js configuration
│   ├── tailwind.config.js      # Tailwind theme configuration
│   ├── package.json
│   └── vercel.json             # Vercel deployment config
│
├── functions/                  # Firebase Cloud Functions (shared)
│   ├── cloudFunctions/         # Source code
│   │   ├── payments/           # Stripe webhooks
│   │   ├── marketplace/        # Marketplace logic
│   │   └── index.js            # Function exports
│   └── package.json
│
├── docs/
│   ├── central-texas/          # CentralTexas.com documentation
│   │   ├── CENTRAL_TEXAS_CONTEXT.md  # Main AI context (router)
│   │   ├── 01-technical.md     # THIS FILE
│   │   └── 02-listings.md      # Inventory schema (to be created)
│   └── projects/
│       └── 4-central-texas.md  # Strategic roadmap
│
├── firebase.json               # Firebase configuration (shared)
├── firestore.rules             # Security rules
├── firestore.indexes.json      # Firestore indexes
├── package.json                # Root workspace config
└── yarn.lock
```

### Key Directories Explained

- **`/centraltexas/app/(sites)/`**: Multi-tenant routes that render custom domain sites
- **`/centraltexas/app/admin/`**: Internal tools (Listing Manager, Site Editor)
- **`/centraltexas/lib/dbServices/`**: Modular Firestore access layer
- **`/functions/cloudFunctions/payments/`**: Stripe webhook handlers

---

## 🔌 Multi-Tenant Implementation

### Middleware Pattern (Vercel Edge)

**File:** `/centraltexas/middleware.js`

```javascript
// Intercept all requests and route based on domain
import { NextResponse } from "next/server";

export async function middleware(request) {
  const hostname = request.headers.get("host");

  // Extract subdomain or custom domain
  const currentHost = hostname.replace(".centraltexas.com", "");

  // Skip for static files and API routes
  if (
    hostname.includes("localhost") ||
    hostname.includes("_next") ||
    hostname.includes("api/")
  ) {
    return NextResponse.next();
  }

  // Query Firestore for site by domain
  // (Actual implementation will use Firebase Admin SDK)
  const siteData = await getSiteByDomain(hostname);

  if (!siteData) {
    // Redirect to "site not found" page
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // Rewrite to multi-tenant route with site context
  const url = request.nextUrl.clone();
  url.pathname = `/sites/${siteData.id}${url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Domain Configuration (Vercel)

**Wildcard SSL Setup:**

```bash
# Add wildcard domain to Vercel project
vercel domains add *.centraltexas.com

# For custom domains (e.g., joesfencing.com)
vercel domains add joesfencing.com
```

**DNS Configuration:**

- CNAME record: `*.centraltexas.com` → `cname.vercel-dns.com`
- For custom domains: `joesfencing.com` → `cname.vercel-dns.com`

---

## 🗄️ Data Layer (Firebase)

### Firestore Schema (Complete)

**Design Philosophy:**

- **Unified Inventory Model:** Single schema supports BOTH Services (hourly-rate pricing) AND Goods (SKU/variant-based pricing)
- **Marketplace Aggregation:** All listings searchable across sites via composite indexes
- **Square-Inspired:** Follows Square's pattern of Items → Variants → Inventory tracking
- **Multi-Tenant:** Site isolation via `siteId` foreign keys with marketplace-wide queries

---

### Collection: `sites/{siteId}`

**Purpose:** Multi-tenant site configurations. Each site represents one business's custom-domain website.

**Document Structure:**

```javascript
// Collection: sites
// Document ID: Auto-generated (e.g., "site_abc123")

domain; // String - Custom domain (e.g., "joesfencing.com", "plumber-kyle.centraltexas.com")
// REQUIRED. Must be unique. Used by middleware for domain routing.

subdomain; // String | null - Subdomain slug (e.g., "joesfencing" for joesfencing.centraltexas.com)
// Optional. Used for sites without custom domains. Unique constraint.

ownerId; // String - Firebase Auth UID of site owner
// REQUIRED. Used for access control in Firestore rules.

businessName; // String - Business display name (e.g., "Joe's Fencing & Repair")
// REQUIRED. Appears in site header and marketplace listings.

description; // String - Business description (max 500 chars)
// Optional. Used for SEO and marketplace profiles.

category; // String - Business category (e.g., "fencing", "plumbing", "landscaping")
// REQUIRED. Enum-like values. Used for marketplace filtering.
// Initial values: ["fencing", "plumbing", "landscaping", "electrical", "hvac", "roofing", "general_contractor"]

location; // Object - Business location data
// REQUIRED for Home Services. Used for geo-radius search.
location.city; // String - City name (e.g., "Kyle")
location.state; // String - State code (e.g., "TX")
location.zip; // String - ZIP code (e.g., "78640")
location.coordinates; // GeoPoint - Firestore GeoPoint for proximity search
location.serviceRadius; // Number - Service radius in miles (default: 25)

theme; // String - Site theme ID
// REQUIRED. One of: ["the-maker", "the-trade", "the-venue"]

sections; // Array<Object> - Ordered list of site sections
// REQUIRED. Defines site structure (order matters).
// Example: [
//   { type: "hero", visible: true, data: { headline: "...", image: "..." } },
//   { type: "services", visible: true, data: {} },
//   { type: "about", visible: true, data: { bio: "..." } },
//   { type: "contact", visible: true, data: { phone: "...", email: "..." } }
// ]

contact; // Object - Business contact information
contact.phone; // String - Phone number (formatted: "(512) 555-1234")
contact.email; // String - Email address
contact.website; // String | null - Original website (if migrating)

branding; // Object - Visual customization (constrained by theme)
branding.logo; // String | null - Cloud Storage URL to logo image
branding.primaryColor; // String - Hex color (from preset palette)
branding.accentColor; // String - Hex color (from preset palette)

stripeAccountId; // String | null - Stripe Connect account ID
// Optional. Set after Stripe onboarding. Format: "acct_..."

status; // String - Site status
// REQUIRED. One of: ["draft", "active", "suspended"]
// "draft" = Not published yet
// "active" = Live and discoverable
// "suspended" = Hidden (payment issues or ToS violation)

isPremium; // Boolean - Premium subscription status
// Default: false. If true, site owner pays $29/mo instead of 10% fees.

metadata; // Object - System metadata
metadata.createdAt; // Timestamp - Creation date
metadata.updatedAt; // Timestamp - Last modified date
metadata.publishedAt; // Timestamp | null - First publish date
metadata.lastSyncedAt; // Timestamp - Last sync to marketplace
```

**Indexes Required:**

```json
{
  "collectionGroup": "sites",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
}
```

**Example Document:**

```javascript
// sites/site_abc123
{
  domain: "joesfencing.com",
  subdomain: null,
  ownerId: "user_xyz789",
  businessName: "Joe's Fencing & Repair",
  description: "Professional fence installation and repair serving Kyle, TX and surrounding areas for over 15 years.",
  category: "fencing",
  location: {
    city: "Kyle",
    state: "TX",
    zip: "78640",
    coordinates: new GeoPoint(30.0133, -97.8739),
    serviceRadius: 25
  },
  theme: "the-trade",
  sections: [
    { type: "hero", visible: true, data: { headline: "Expert Fence Solutions", image: "gs://..." } },
    { type: "services", visible: true, data: {} },
    { type: "about", visible: true, data: { bio: "Family-owned business..." } },
    { type: "contact", visible: true, data: { phone: "(512) 555-1234", email: "joe@joesfencing.com" } }
  ],
  contact: {
    phone: "(512) 555-1234",
    email: "joe@joesfencing.com",
    website: null
  },
  branding: {
    logo: "gs://davis-centraltexas/sites/abc123/logo.png",
    primaryColor: "#2C3E50",
    accentColor: "#E67E22"
  },
  stripeAccountId: "acct_1234567890",
  status: "active",
  isPremium: false,
  metadata: {
    createdAt: Timestamp(2026, 1, 15, 10, 30),
    updatedAt: Timestamp(2026, 2, 1, 14, 22),
    publishedAt: Timestamp(2026, 1, 20, 9, 0),
    lastSyncedAt: Timestamp(2026, 2, 1, 14, 22)
  }
}
```

---

### Collection: `listings/{listingId}`

**Purpose:** Top-level inventory items. Supports BOTH Services (e.g., "Fence Repair - $50/hr") AND Goods (e.g., "T-Shirt" with variants).

**Document Structure:**

```javascript
// Collection: listings
// Document ID: Auto-generated (e.g., "listing_def456")

siteId; // String - Reference to sites/{siteId}
// REQUIRED. Links listing to owning site. Used for site-specific queries.

title; // String - Item name (e.g., "Fence Repair", "Red Oak T-Shirt")
// REQUIRED. Max 100 chars. Used in search and display.

description; // String - Detailed description
// REQUIRED. Max 2000 chars. Supports markdown for rich text.

type; // String - Listing type
// REQUIRED. One of: ["service", "good"]
// "service" = Hourly-rate or project-based pricing (no inventory tracking)
// "good" = Physical product with SKU variants and inventory counts

category; // String - Item category
// REQUIRED. Matches parent site category or subcategory.
// Examples: "fence_installation", "fence_repair", "apparel", "tools"

pricing; // Object - Pricing configuration (varies by type)
// REQUIRED. Structure depends on listing type.

// If type === "service":
pricing.model; // String - Pricing model
// One of: ["hourly", "flat_rate", "quote_required"]
pricing.basePrice; // Number | null - Base price in dollars (e.g., 50.00 for $50/hr)
// Required if model !== "quote_required". Null for quote-based services.
pricing.unit; // String | null - Pricing unit
// One of: ["hour", "project", "square_foot", "linear_foot", null]
pricing.minCharge; // Number | null - Minimum charge (e.g., 2-hour minimum)
pricing.maxPrice; // Number | null - Maximum price (for estimates)

// If type === "good":
pricing.model; // String - Always "variant_based"
pricing.basePrice; // Number - Base price (lowest variant price, for display)
// Auto-calculated from variants. Used for "Starting at $X" display.
pricing.currency; // String - Currency code (default: "USD")

images; // Array<String> - Cloud Storage URLs to images
// REQUIRED. Min 1, max 10. Order matters (first = primary).
// Format: ["gs://bucket/path/image1.jpg", ...]

variants; // Object - Variant configuration (only for type === "good")
// Structure described below. Null for services.

inventory; // Object - Inventory tracking (only for type === "good")
inventory.trackQuantity; // Boolean - Whether to track stock levels
// Default: true for goods, false for services.
inventory.totalAvailable; // Number - Sum of all variant inventory counts
// Auto-calculated. Updated by Cloud Function on variant changes.
inventory.lowStockThreshold; // Number - Alert threshold (e.g., 5)

availability; // Object - Availability settings
availability.isAvailable; // Boolean - Whether item is bookable/purchasable
// Default: true. Set to false to hide from marketplace.
availability.schedule; // Object | null - Time-based availability (for services)
availability.schedule.days; // Array<String> - Available days (e.g., ["monday", "tuesday", ...])
availability.schedule.hours; // Object - { start: "09:00", end: "17:00" }

metadata; // Object - System metadata
metadata.createdAt; // Timestamp - Creation date
metadata.updatedAt; // Timestamp - Last modified date
metadata.viewCount; // Number - Marketplace view count
metadata.orderCount; // Number - Total orders placed
metadata.rating; // Number | null - Average rating (1-5)
metadata.reviewCount; // Number - Number of reviews

status; // String - Listing status
// REQUIRED. One of: ["draft", "active", "archived"]
```

**Indexes Required:**

```json
{
  "collectionGroup": "listings",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "listings",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "siteId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
}
```

**Example Document (Service):**

```javascript
// listings/listing_service123
{
  siteId: "site_abc123",
  title: "Fence Repair & Maintenance",
  description: "Professional fence repair service including post replacement, panel repair, staining, and general maintenance. We fix all fence types: wood, vinyl, chain-link, and wrought iron.",
  type: "service",
  category: "fence_repair",
  pricing: {
    model: "hourly",
    basePrice: 75.00,
    unit: "hour",
    minCharge: 2, // 2-hour minimum
    maxPrice: null
  },
  images: [
    "gs://davis-centraltexas/listings/service123/fence-repair-1.jpg",
    "gs://davis-centraltexas/listings/service123/fence-repair-2.jpg"
  ],
  variants: null,
  inventory: {
    trackQuantity: false,
    totalAvailable: null,
    lowStockThreshold: null
  },
  availability: {
    isAvailable: true,
    schedule: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      hours: { start: "08:00", end: "17:00" }
    }
  },
  metadata: {
    createdAt: Timestamp(2026, 1, 22, 11, 0),
    updatedAt: Timestamp(2026, 2, 3, 15, 30),
    viewCount: 47,
    orderCount: 12,
    rating: 4.8,
    reviewCount: 9
  },
  status: "active"
}
```

**Example Document (Good with Variants):**

```javascript
// listings/listing_good456
{
  siteId: "site_xyz789",
  title: "Premium Work T-Shirt",
  description: "Heavy-duty cotton work shirt. Reinforced stitching, moisture-wicking fabric. Available in multiple colors and sizes.",
  type: "good",
  category: "apparel",
  pricing: {
    model: "variant_based",
    basePrice: 24.99, // Lowest variant price
    currency: "USD"
  },
  images: [
    "gs://davis-centraltexas/listings/good456/tshirt-front.jpg",
    "gs://davis-centraltexas/listings/good456/tshirt-back.jpg"
  ],
  variants: {
    // Variant configuration (detailed in variants collection below)
    hasVariants: true,
    options: [
      { name: "Color", values: ["Red", "Blue", "Black"] },
      { name: "Size", values: ["S", "M", "L", "XL"] }
    ]
  },
  inventory: {
    trackQuantity: true,
    totalAvailable: 48, // Sum of all variant inventory
    lowStockThreshold: 10
  },
  availability: {
    isAvailable: true,
    schedule: null // Not applicable for goods
  },
  metadata: {
    createdAt: Timestamp(2026, 1, 25, 9, 15),
    updatedAt: Timestamp(2026, 2, 4, 10, 22),
    viewCount: 134,
    orderCount: 28,
    rating: 4.6,
    reviewCount: 18
  },
  status: "active"
}
```

---

### Collection: `variants/{variantId}`

**Purpose:** SKU-level variants for Goods. Each variant represents a unique combination of options (e.g., "Red/Large").

**Document Structure:**

```javascript
// Collection: variants
// Document ID: Auto-generated (e.g., "variant_ghi789")

listingId; // String - Reference to listings/{listingId}
// REQUIRED. Parent listing. Must be type === "good".

siteId; // String - Reference to sites/{siteId}
// REQUIRED. Denormalized for efficient site-level queries.

sku; // String - Stock Keeping Unit (unique identifier)
// REQUIRED. Format: "LISTING_OPTION1_OPTION2" (e.g., "TSHIRT_RED_L")
// Must be unique within listing. Used for inventory tracking.

name; // String - Human-readable variant name
// REQUIRED. Format: "Option1 Value / Option2 Value" (e.g., "Red / Large")

options; // Object - Key-value pairs of variant options
// REQUIRED. Keys match parent listing's variant.options[].name
// Example: { "Color": "Red", "Size": "Large" }

price; // Number - Variant-specific price in dollars
// REQUIRED. Can differ from basePrice (e.g., XL costs more).

compareAtPrice; // Number | null - Original price (for sale display)
// Optional. Used to show discounts (e.g., "$29.99 was $39.99").

inventory; // Object - Stock tracking
inventory.quantity; // Number - Current available stock
// REQUIRED. Updated on orders. Cannot go negative.
inventory.reserved; // Number - Items in pending orders (not yet paid)
// Default: 0. Reserved items count against available quantity.
inventory.lowStockThreshold; // Number | null - Variant-specific alert threshold

images; // Array<String> - Variant-specific images
// Optional. Overrides parent listing images for this variant.
// Example: Red shirt shows red photos, Blue shows blue photos.

weight; // Object | null - Shipping weight (if physical shipping needed)
weight.value; // Number - Weight value
weight.unit; // String - Unit (e.g., "lb", "oz", "kg")

dimensions; // Object | null - Shipping dimensions
dimensions.length; // Number
dimensions.width; // Number
dimensions.height; // Number
dimensions.unit; // String - Unit (e.g., "in", "cm")

metadata; // Object - System metadata
metadata.createdAt; // Timestamp - Creation date
metadata.updatedAt; // Timestamp - Last modified date
metadata.lastSold; // Timestamp | null - Last sale date

status; // String - Variant status
// REQUIRED. One of: ["active", "discontinued"]
```

**Indexes Required:**

```json
{
  "collectionGroup": "variants",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "listingId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "variants",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "siteId", "order": "ASCENDING" },
    { "fieldPath": "inventory.quantity", "order": "ASCENDING" }
  ]
}
```

**Example Documents:**

```javascript
// variants/variant_red_large
{
  listingId: "listing_good456",
  siteId: "site_xyz789",
  sku: "TSHIRT_RED_L",
  name: "Red / Large",
  options: {
    "Color": "Red",
    "Size": "Large"
  },
  price: 24.99,
  compareAtPrice: null,
  inventory: {
    quantity: 15,
    reserved: 2, // 2 in pending orders
    lowStockThreshold: 5
  },
  images: [
    "gs://davis-centraltexas/listings/good456/tshirt-red.jpg"
  ],
  weight: {
    value: 0.5,
    unit: "lb"
  },
  dimensions: {
    length: 12,
    width: 10,
    height: 1,
    unit: "in"
  },
  metadata: {
    createdAt: Timestamp(2026, 1, 25, 9, 15),
    updatedAt: Timestamp(2026, 2, 4, 10, 22),
    lastSold: Timestamp(2026, 2, 3, 14, 30)
  },
  status: "active"
}

// variants/variant_blue_medium
{
  listingId: "listing_good456",
  siteId: "site_xyz789",
  sku: "TSHIRT_BLUE_M",
  name: "Blue / Medium",
  options: {
    "Color": "Blue",
    "Size": "Medium"
  },
  price: 24.99,
  compareAtPrice: null,
  inventory: {
    quantity: 8,
    reserved: 0,
    lowStockThreshold: 5
  },
  images: [
    "gs://davis-centraltexas/listings/good456/tshirt-blue.jpg"
  ],
  weight: {
    value: 0.5,
    unit: "lb"
  },
  dimensions: {
    length: 12,
    width: 10,
    height: 1,
    unit: "in"
  },
  metadata: {
    createdAt: Timestamp(2026, 1, 25, 9, 15),
    updatedAt: Timestamp(2026, 2, 2, 16, 45),
    lastSold: Timestamp(2026, 2, 1, 11, 20)
  },
  status: "active"
}
```

---

### Collection: `inventory/{inventoryId}`

**Purpose:** Historical inventory tracking and audit log. Records all inventory movements (sales, restocks, adjustments).

**Document Structure:**

```javascript
// Collection: inventory
// Document ID: Auto-generated (e.g., "inv_jkl012")

variantId; // String - Reference to variants/{variantId}
// REQUIRED. The variant this movement applies to.

listingId; // String - Reference to listings/{listingId}
// REQUIRED. Denormalized for reporting.

siteId; // String - Reference to sites/{siteId}
// REQUIRED. Denormalized for reporting.

type; // String - Movement type
// REQUIRED. One of: ["sale", "restock", "adjustment", "return", "reservation", "release"]
// "sale" = Sold to customer (decreases quantity)
// "restock" = Added inventory (increases quantity)
// "adjustment" = Manual correction (±)
// "return" = Customer return (increases quantity)
// "reservation" = Reserved for pending order (decreases available, not quantity)
// "release" = Reservation released (payment failed, increases available)

quantity; // Number - Quantity changed (positive or negative)
// REQUIRED. Positive = increase, Negative = decrease.

reason; // String | null - Human-readable reason
// Optional. E.g., "Customer order #123", "Damaged goods", "Inventory count correction"

orderId; // String | null - Reference to orders/{orderId}
// Optional. Set for sale/return movements tied to orders.

balanceAfter; // Number - Inventory balance after this movement
// REQUIRED. Used for audit trail and reconciliation.

performedBy; // String - User who performed action
// REQUIRED. Firebase Auth UID or "system" for automated actions.

metadata; // Object - System metadata
metadata.createdAt; // Timestamp - Movement timestamp
metadata.source; // String - Source of movement (e.g., "admin_ui", "checkout", "api")

notes; // String | null - Additional notes
// Optional. Free-form text for audit context.
```

**Indexes Required:**

```json
{
  "collectionGroup": "inventory",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "variantId", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "inventory",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "siteId", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
}
```

**Example Documents:**

```javascript
// inventory/inv_restock001
{
  variantId: "variant_red_large",
  listingId: "listing_good456",
  siteId: "site_xyz789",
  type: "restock",
  quantity: 20,
  reason: "Weekly inventory restock",
  orderId: null,
  balanceAfter: 35,
  performedBy: "user_xyz789",
  metadata: {
    createdAt: Timestamp(2026, 2, 1, 10, 0),
    source: "admin_ui"
  },
  notes: "Added 20 units from supplier shipment"
}

// inventory/inv_sale001
{
  variantId: "variant_red_large",
  listingId: "listing_good456",
  siteId: "site_xyz789",
  type: "sale",
  quantity: -1,
  reason: "Customer purchase",
  orderId: "order_mno345",
  balanceAfter: 34,
  performedBy: "system",
  metadata: {
    createdAt: Timestamp(2026, 2, 3, 14, 30),
    source: "checkout"
  },
  notes: null
}
```

---

### Collection: `orders/{orderId}`

**Purpose:** Transaction records. Captures all purchases (both Services and Goods) with Stripe Payment Intent data.

**Document Structure:**

```javascript
// Collection: orders
// Document ID: Auto-generated (e.g., "order_mno345")

siteId; // String - Reference to sites/{siteId}
// REQUIRED. Seller's site.

listingId; // String - Reference to listings/{listingId}
// REQUIRED. Item purchased.

variantId; // String | null - Reference to variants/{variantId}
// Required if listing type === "good". Null for services.

buyerInfo; // Object - Customer information
buyerInfo.userId; // String | null - Firebase Auth UID (if logged in)
buyerInfo.email; // String - Customer email
buyerInfo.name; // String - Customer name
buyerInfo.phone; // String | null - Customer phone

itemDetails; // Object - Snapshot of item at time of purchase
itemDetails.title; // String - Item title (frozen at purchase time)
itemDetails.description; // String - Item description
itemDetails.variantName; // String | null - Variant name (e.g., "Red / Large")
itemDetails.sku; // String | null - SKU code
itemDetails.quantity; // Number - Quantity purchased (default: 1 for services)
itemDetails.images; // Array<String> - Image URLs

pricing; // Object - Pricing breakdown
pricing.itemPrice; // Number - Base item/variant price
pricing.quantity; // Number - Quantity ordered
pricing.subtotal; // Number - itemPrice × quantity
pricing.platformFee; // Number - CentralTexas.com fee (10% of subtotal)
pricing.stripeFee; // Number - Stripe processing fee (2.9% + $0.30)
pricing.total; // Number - Total charged to customer
pricing.sellerPayout; // Number - Amount paid to seller (subtotal - platformFee)

stripeData; // Object - Stripe integration data
stripeData.paymentIntentId; // String - Stripe Payment Intent ID (e.g., "pi_...")
stripeData.chargeId; // String | null - Stripe Charge ID (after capture)
stripeData.connectedAccountId; // String - Seller's Stripe Connect account
stripeData.receiptUrl; // String | null - Stripe receipt URL

fulfillment; // Object - Fulfillment details (type-specific)
// For Services:
fulfillment.type; // String - "service" | "good"
fulfillment.scheduledDate; // Timestamp | null - Appointment date/time
fulfillment.notes; // String | null - Customer notes/requests
// For Goods:
fulfillment.shippingAddress; // Object | null - Delivery address
fulfillment.shippingAddress.line1; // String
fulfillment.shippingAddress.line2; // String | null
fulfillment.shippingAddress.city; // String
fulfillment.shippingAddress.state; // String
fulfillment.shippingAddress.zip; // String
fulfillment.trackingNumber; // String | null - Shipping tracking number
fulfillment.carrier; // String | null - Shipping carrier (e.g., "USPS", "UPS")

status; // String - Order status
// REQUIRED. One of: ["pending", "paid", "confirmed", "in_progress", "completed", "cancelled", "refunded"]
// "pending" = Payment Intent created, not yet paid
// "paid" = Payment succeeded, awaiting seller confirmation
// "confirmed" = Seller confirmed order
// "in_progress" = Service in progress or goods shipped
// "completed" = Service finished or goods delivered
// "cancelled" = Order cancelled before completion
// "refunded" = Payment refunded to customer

metadata; // Object - System metadata
metadata.createdAt; // Timestamp - Order creation date
metadata.paidAt; // Timestamp | null - Payment success date
metadata.completedAt; // Timestamp | null - Fulfillment completion date
metadata.source; // String - Order source (e.g., "site_checkout", "marketplace", "admin")

communication; // Array<Object> - Order communication log
// Optional. Timeline of messages between buyer and seller.
// Example: [
//   { timestamp: Timestamp, from: "buyer", message: "Can you come at 2pm?" },
//   { timestamp: Timestamp, from: "seller", message: "Yes, see you then!" }
// ]
```

**Indexes Required:**

```json
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "siteId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "buyerInfo.userId", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "orders",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "metadata.createdAt", "order": "DESCENDING" }
  ]
}
```

**Example Document (Service Order):**

```javascript
// orders/order_service789
{
  siteId: "site_abc123",
  listingId: "listing_service123",
  variantId: null,
  buyerInfo: {
    userId: "user_buyer123",
    email: "customer@example.com",
    name: "Jane Smith",
    phone: "(512) 555-9876"
  },
  itemDetails: {
    title: "Fence Repair & Maintenance",
    description: "Professional fence repair service...",
    variantName: null,
    sku: null,
    quantity: 3, // 3 hours
    images: ["gs://..."]
  },
  pricing: {
    itemPrice: 75.00,
    quantity: 3,
    subtotal: 225.00,
    platformFee: 22.50, // 10%
    stripeFee: 6.83, // 2.9% + $0.30
    total: 225.00,
    sellerPayout: 195.67 // subtotal - platformFee - stripeFee
  },
  stripeData: {
    paymentIntentId: "pi_3AbcDef123456",
    chargeId: "ch_3AbcDef123456",
    connectedAccountId: "acct_1234567890",
    receiptUrl: "https://stripe.com/receipts/..."
  },
  fulfillment: {
    type: "service",
    scheduledDate: Timestamp(2026, 2, 10, 14, 0), // Feb 10, 2pm
    notes: "Please call when arriving. Gate code is 1234.",
    shippingAddress: null,
    trackingNumber: null,
    carrier: null
  },
  status: "confirmed",
  metadata: {
    createdAt: Timestamp(2026, 2, 5, 11, 22),
    paidAt: Timestamp(2026, 2, 5, 11, 23),
    completedAt: null,
    source: "site_checkout"
  },
  communication: [
    {
      timestamp: Timestamp(2026, 2, 5, 12, 0),
      from: "seller",
      message: "Confirmed! I'll be there Feb 10 at 2pm."
    }
  ]
}
```

**Example Document (Good Order):**

```javascript
// orders/order_good890
{
  siteId: "site_xyz789",
  listingId: "listing_good456",
  variantId: "variant_red_large",
  buyerInfo: {
    userId: null, // Guest checkout
    email: "guest@example.com",
    name: "John Doe",
    phone: "(512) 555-5555"
  },
  itemDetails: {
    title: "Premium Work T-Shirt",
    description: "Heavy-duty cotton work shirt...",
    variantName: "Red / Large",
    sku: "TSHIRT_RED_L",
    quantity: 2,
    images: ["gs://..."]
  },
  pricing: {
    itemPrice: 24.99,
    quantity: 2,
    subtotal: 49.98,
    platformFee: 4.998, // 10%
    stripeFee: 1.78,
    total: 49.98,
    sellerPayout: 43.20
  },
  stripeData: {
    paymentIntentId: "pi_3XyzAbc987654",
    chargeId: "ch_3XyzAbc987654",
    connectedAccountId: "acct_9876543210",
    receiptUrl: "https://stripe.com/receipts/..."
  },
  fulfillment: {
    type: "good",
    scheduledDate: null,
    notes: null,
    shippingAddress: {
      line1: "123 Main St",
      line2: "Apt 4B",
      city: "Austin",
      state: "TX",
      zip: "78701"
    },
    trackingNumber: "1Z999AA10123456784",
    carrier: "UPS"
  },
  status: "in_progress",
  metadata: {
    createdAt: Timestamp(2026, 2, 6, 9, 30),
    paidAt: Timestamp(2026, 2, 6, 9, 31),
    completedAt: null,
    source: "marketplace"
  },
  communication: []
}
```

---

### Schema Summary

**Collections Overview:**

| Collection  | Purpose                              | Key Relationships                      | Marketplace Role                   |
| ----------- | ------------------------------------ | -------------------------------------- | ---------------------------------- |
| `sites`     | Multi-tenant site configurations     | N/A (top-level)                        | Seller profiles                    |
| `listings`  | Top-level inventory (Services/Goods) | `sites.id → listings.siteId`           | Searchable marketplace items       |
| `variants`  | SKU variants for Goods               | `listings.id → variants.listingId`     | Individual purchasable SKUs        |
| `inventory` | Inventory movement audit log         | `variants.id → inventory.variantId`    | Stock tracking history             |
| `orders`    | Transaction records                  | `sites/listings/variants → orders.*Id` | Revenue tracking, seller dashboard |

**Key Design Decisions:**

1. **Unified Model:** Single `listings` collection handles both Services and Goods via `type` field, reducing complexity.
2. **Variant Flexibility:** Goods use separate `variants` collection for SKU-level pricing/inventory, supporting unlimited option combinations.
3. **Marketplace Aggregation:** All listings have `siteId` foreign key but remain globally queryable for marketplace discovery.
4. **Audit Trail:** `inventory` collection provides complete historical log of stock movements for compliance and debugging.
5. **Denormalization:** Key IDs (`siteId`, `listingId`) denormalized into child collections for efficient queries.
6. **Stripe Integration:** `orders` collection captures full Stripe Payment Intent lifecycle for reconciliation.

### Database Service Pattern

**Following:** [`../dev/server-side-coding-guidelines.md`](../dev/server-side-coding-guidelines.md)

**Module Structure:** `/centraltexas/lib/dbServices/`

```
dbServices/
├── sitesService.js      # CRUD for sites collection
├── listingsService.js   # CRUD for listings/variants
├── ordersService.js     # Order management
└── utils/
    └── firestore.js     # Firestore client singleton
```

**Example Service Module:**

```javascript
// dbServices/sitesService.js

/**
 * Fetch a site by custom domain
 * @param {Object} db - Firestore instance (injected for testability)
 * @param {string} domain - Custom domain (e.g., "joesfencing.com")
 * @returns {Promise<Object|null>} Site document or null
 */
export async function getSiteByDomain(db, domain) {
  try {
    const sitesRef = db.collection("sites");
    const snapshot = await sitesRef
      .where("domain", "==", domain)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[getSiteByDomain] Error fetching site:", { domain, error });
    throw new Error("Failed to fetch site by domain");
  }
}

/**
 * Create a new site
 * @param {Object} db - Firestore instance
 * @param {Object} siteData - Site configuration
 * @returns {Promise<string>} New site ID
 */
export async function createSite(db, siteData) {
  // Validate inputs early (fail fast)
  if (!siteData.domain || !siteData.ownerId) {
    throw new Error("Domain and ownerId are required");
  }

  try {
    const sitesRef = db.collection("sites");
    const docRef = await sitesRef.add({
      ...siteData,
      createdAt: new Date(),
      status: "active",
    });

    return docRef.id;
  } catch (error) {
    console.error("[createSite] Error creating site:", { siteData, error });
    throw new Error("Failed to create site");
  }
}
```

**Key Patterns:**

- **Dependency Injection:** Pass `db` instance as parameter (enables mocking)
- **Single Responsibility:** One function = one database operation
- **Error Handling:** Try/catch with informative logging
- **Pure Logic:** Business logic separated from database calls

### Firebase Admin SDK (Server-Side)

**Configuration:** `/centraltexas/lib/firebase/admin.js`

```javascript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin (singleton pattern)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
```

### Firebase Client SDK (Client-Side)

**Configuration:** `/centraltexas/lib/firebase/client.js`

```javascript
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase client (singleton)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 🧪 Testing Strategy

### Testing Framework Setup

**E2E Testing:** Cypress or Playwright  
**Unit Testing:** Vitest  
**Test Location:** `/centraltexas/__tests__/`

### E2E Testing (Multi-Tenant Rendering)

**Goal:** Verify that custom domains render correct site content.

**Test Structure:**

```
__tests__/
├── e2e/
│   ├── multi-tenant.spec.js     # Domain routing tests
│   ├── listing-manager.spec.js  # Admin UI tests
│   └── checkout-flow.spec.js    # Payment integration tests
└── cypress.config.js
```

**Example E2E Test:**

```javascript
// __tests__/e2e/multi-tenant.spec.js
describe("Multi-Tenant Domain Routing", () => {
  it("should render correct site for custom domain", () => {
    cy.visit("http://joesfencing.test.local");
    cy.contains("Joe's Fencing");
    cy.get('[data-testid="service-block"]').should(
      "have.length.greaterThan",
      0
    );
  });

  it("should show 404 for non-existent domain", () => {
    cy.visit("http://nonexistent.test.local");
    cy.contains("Site Not Found");
  });
});
```

### Unit Testing (Component Logic)

**Goal:** Test business logic and components in isolation.

**Example Unit Test:**

```javascript
// __tests__/unit/dbServices/sitesService.test.js
import { describe, it, expect, vi } from "vitest";
import { getSiteByDomain } from "@/lib/dbServices/sitesService";

describe("sitesService", () => {
  it("should fetch site by domain", async () => {
    // Mock Firestore
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: [{ id: "site123", data: () => ({ domain: "test.com" }) }],
        }),
      }),
    };

    const site = await getSiteByDomain(mockDb, "test.com");

    expect(site).toEqual({ id: "site123", domain: "test.com" });
  });
});
```

### Testing Configuration Files

**Cypress:** `/centraltexas/cypress.config.js`  
**Vitest:** `/centraltexas/vitest.config.js`

---

## 🚀 Development Setup

### Prerequisites

- **Node.js:** v20+ (specified in `/functions/package.json`)
- **Yarn:** v1.22+ (monorepo workspace manager)
- **Vercel CLI:** `npm i -g vercel`
- **Firebase CLI:** `npm i -g firebase-tools`
- **Git:** For version control

### Initial Setup

```bash
# Clone repository
git clone [repository-url]
cd davis

# Install dependencies (root + all workspaces)
yarn install

# Authenticate with Firebase
firebase login

# Authenticate with Vercel
vercel login

# Set up environment variables (see below)
cp centraltexas/.env.example centraltexas/.env.local
```

### Environment Variables

**File:** `/centraltexas/.env.local`

```bash
# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Private - Server-side only)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Environment
NODE_ENV=development
```

### Local Development

```bash
# Start CentralTexas.com app (Vercel dev server)
cd centraltexas
yarn dev
# Runs on http://localhost:3000

# Test with local domain (add to /etc/hosts)
# 127.0.0.1 test.centraltexas.local
# Access at http://test.centraltexas.local:3000

# Start Firebase emulators (optional)
firebase emulators:start
```

### Development Workflow

1. **Create Feature Branch:** `git checkout -b feature/listing-manager`
2. **Write Tests First:** Create test file in `__tests__/`
3. **Implement Feature:** Write code following modular patterns
4. **Run Tests Locally:** `yarn test`
5. **Commit Changes:** `git commit -m "feat: add listing manager"`
6. **Push to GitHub:** `git push origin feature/listing-manager`
7. **CI/CD Runs:** GitHub Actions automatically deploys to Vercel Preview
8. **Review Preview URL:** Check deployment at unique preview URL
9. **Merge to Main:** Deploy to production on merge

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/centraltexas-deploy.yml`

```yaml
name: CentralTexas Deploy

on:
  push:
    branches: [main]
    paths:
      - "centraltexas/**"
  pull_request:
    branches: [main]
    paths:
      - "centraltexas/**"

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Lint
        run: cd centraltexas && yarn lint

      - name: Run unit tests
        run: cd centraltexas && yarn test:unit

      - name: Run E2E tests
        run: cd centraltexas && yarn test:e2e

  deploy-preview:
    needs: lint-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Deploy to Vercel Preview
        run: |
          cd centraltexas
          vercel deploy --token=${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Deploy to Vercel Production
        run: |
          cd centraltexas
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Required GitHub Secrets

Add these in GitHub repo settings → Secrets and variables → Actions:

- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Organization ID from `.vercel/project.json`
- `VERCEL_PROJECT_ID`: Project ID from `.vercel/project.json`
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (for Functions deploy)

---

## 📦 Deployment Process

### Vercel Deployment (CLI-Only)

**CRITICAL CONSTRAINT:** All Vercel operations MUST use CLI (no dashboard).

#### Initial Project Setup

```bash
cd centraltexas

# Link to Vercel project (first time only)
vercel link

# Configure environment variables
vercel env add FIREBASE_PROJECT_ID production
vercel env add FIREBASE_PRIVATE_KEY production
vercel env add STRIPE_SECRET_KEY production
# ... add all required env vars
```

#### Deploy to Preview

```bash
# Deploy current branch to preview environment
vercel

# Get preview URL
vercel inspect [deployment-url]
```

#### Deploy to Production

```bash
# Deploy to production (main branch only)
vercel --prod
```

#### Domain Management

```bash
# Add custom domain
vercel domains add joesfencing.com

# List all domains
vercel domains ls

# Remove domain
vercel domains rm joesfencing.com
```

### Firebase Functions Deployment

```bash
cd functions

# Build functions
yarn build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:stripeWebhook
```

### Firestore Security Rules & Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## 🎨 Frontend Architecture

### Next.js App Router Structure

**Route Organization:**

```
centraltexas/app/
├── (marketing)/              # Marketing site (centraltexas.com root)
│   ├── page.js               # Homepage
│   ├── pricing/page.js
│   └── layout.js
│
├── (sites)/                  # Multi-tenant routes (custom domains)
│   ├── [domain]/             # Dynamic domain routing
│   │   ├── page.js           # Site homepage
│   │   ├── services/page.js
│   │   └── layout.js
│   └── layout.js
│
├── admin/                    # Internal admin tools
│   ├── sites/page.js         # Site manager
│   ├── listings/page.js      # Listing manager
│   ├── editor/page.js        # Site editor
│   └── layout.js
│
└── api/                      # API routes
    ├── sites/route.js
    ├── listings/route.js
    └── stripe/webhook/route.js
```

### Component Architecture

**Material UI v4 + Custom Components:**

```
components/
├── editor/                   # Site Editor
│   ├── SectionEditor.js      # Section-based editor (Puck/BlockNote)
│   ├── ServiceBlock.js       # Service listing block
│   └── HeroEditor.js
│
├── listings/                 # Listing Manager
│   ├── ListingGrid.js        # Square-style item grid
│   ├── VariantEditor.js      # SKU variant management
│   └── InventoryCounter.js
│
├── sites/                    # Site Templates
│   ├── themes/               # 3 rigid themes
│   │   ├── TheMaker.js
│   │   ├── TheTrade.js
│   │   └── TheVenue.js
│   └── sections/             # Reusable sections
│       ├── HeroSection.js
│       ├── ServicesSection.js
│       └── ContactSection.js
│
└── ui/                       # Shared UI components
    ├── Button.js
    ├── Card.js
    └── Modal.js
```

### Styling (Tailwind + Material UI)

**Configuration:** `/centraltexas/tailwind.config.js`

```javascript
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Define 3 rigid theme palettes
        maker: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
        },
        trade: {
          primary: "#2C3E50",
          secondary: "#E67E22",
        },
        venue: {
          primary: "#9B59B6",
          secondary: "#F39C12",
        },
      },
    },
  },
  plugins: [],
};
```

**"Anti-Design" Rule:** No drag-and-drop layout. Users can only edit:

- Text content
- Colors (from preset palette)
- Section visibility (show/hide)

---

## 💳 Payments Integration

### Stripe Connect Express

**Revenue Model:**

- **10% Platform Fee** on all transactions
- OR **$29/month** for sellers with >$2k/month volume

**Architecture:**

1. **Onboarding:** Create Stripe Connect account for each site owner
2. **Payment Intent:** Create payment with `application_fee_amount`
3. **Webhook:** Listen for `payment_intent.succeeded` events
4. **Split:** Stripe automatically splits funds (90% to seller, 10% to platform)

**Cloud Function:** `/functions/cloudFunctions/payments/stripeWebhook.js`

```javascript
export async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripeWebhook] Signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // Update order in Firestore
    await db.collection("orders").doc(paymentIntent.metadata.orderId).update({
      status: "completed",
      stripePaymentIntentId: paymentIntent.id,
      completedAt: new Date(),
    });
  }

  res.json({ received: true });
}
```

---

## 🔐 Security Considerations

### Firestore Security Rules

**Pattern:** Role-based access control (RBAC)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sites: Owners can write, public can read active sites
    match /sites/{siteId} {
      allow read: if resource.data.status == 'active';
      allow write: if request.auth.uid == resource.data.ownerId;
    }

    // Listings: Tied to site ownership
    match /listings/{listingId} {
      allow read: if true; // Public marketplace
      allow write: if request.auth != null &&
                      get(/databases/$(database)/documents/sites/$(resource.data.siteId)).data.ownerId == request.auth.uid;
    }

    // Orders: Private to buyer and seller
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.buyerId ||
                     request.auth.uid == resource.data.sellerId;
      allow create: if request.auth != null;
      allow update: if false; // Only Cloud Functions can update
    }
  }
}
```

### Environment Variable Security

- **Client-side:** Only `NEXT_PUBLIC_*` vars exposed to browser
- **Server-side:** Private keys (Firebase Admin, Stripe Secret) never sent to client
- **Vercel:** Encrypted environment variables per deployment stage

---

## ⚠️ Critical Constraints

### 1. JavaScript ONLY (No TypeScript)

**Rationale:** Consistency with existing davis monorepo codebase.

**Rules:**

- NO `.ts` or `.tsx` files
- NO TypeScript syntax (interfaces, types, generics)
- Use JSDoc for type hints: `@param {string} domain`

### 2. CLI-Only Operations (Vercel & Stripe)

**Rationale:** Infrastructure-as-code; avoid "dashboard drift."

**Rules:**

- NO manual changes in Vercel dashboard
- ALL deployments via `vercel` CLI or GitHub Actions
- ALL config changes tracked in git (e.g., `vercel.json`)

### 3. "Anti-Design" Editor (No Drag-and-Drop)

**Rationale:** Prevent users from breaking layout; maintain quality.

**Rules:**

- Section-based editor (Puck or BlockNote)
- Fixed layout templates (3 themes)
- Users can only edit: Text, Colors (preset), Section visibility

### 4. Vertical Constraint (Home Services First)

**Rationale:** Achieve marketplace liquidity via focused "Atomic Network."

**Rules:**

- MVP targets Home Services ONLY (Fencing, Plumbing, Landscaping)
- Data model supports Goods (future-proof) but sales motion excludes them
- Expand to other verticals post-liquidity

---

## 🔧 Troubleshooting

### Common Issues

#### Middleware Not Running

**Symptom:** Custom domains return 404  
**Solution:** Check `middleware.js` matcher pattern; ensure it doesn't exclude your routes

#### Firestore Permission Denied

**Symptom:** Client-side queries fail with "Missing or insufficient permissions"  
**Solution:** Review `firestore.rules`; ensure read rules allow public access for active sites

#### Vercel Build Fails

**Symptom:** Build fails on Vercel but works locally  
**Solution:** Ensure all env vars are set in Vercel project settings

#### Firebase Admin SDK Errors

**Symptom:** "Failed to parse private key" errors  
**Solution:** Check `FIREBASE_PRIVATE_KEY` formatting; ensure `\n` escape sequences are preserved

---

## 📚 Additional Resources

### Official Documentation

- **Next.js App Router:** https://nextjs.org/docs/app
- **Vercel Platforms Starter Kit:** https://github.com/vercel/platforms
- **Firebase JavaScript SDK:** https://firebase.google.com/docs/web/setup
- **Stripe Connect:** https://stripe.com/docs/connect
- **Material UI v4:** https://v4.mui.com/

### Internal Documentation

- **Main Context:** [`CENTRAL_TEXAS_CONTEXT.md`](CENTRAL_TEXAS_CONTEXT.md)
- **Strategic Roadmap:** [`../projects/4-central-texas.md`](../projects/4-central-texas.md)
- **Coding Guidelines:** [`../dev/server-side-coding-guidelines.md`](../dev/server-side-coding-guidelines.md)
- **Inventory Schema:** [`02-listings.md`](02-listings.md) (to be created)

### Learning Resources

- **Vercel Multi-Tenancy:** [Blog Post](https://vercel.com/blog/platforms-starter-kit)
- **Firebase Admin SDK:** [Server-side Guide](https://firebase.google.com/docs/admin/setup)
- **Stripe Connect Express:** [Guide](https://stripe.com/docs/connect/express-accounts)

---

## 🚦 Next Steps

After completing this documentation:

1. **Create Inventory Schema Documentation:** [`02-listings.md`](02-listings.md)
2. **Initialize CentralTexas Next.js App:** `cd centraltexas && yarn create next-app .`
3. **Set Up Vercel Project:** `vercel link`
4. **Configure GitHub Actions:** Create `.github/workflows/centraltexas-deploy.yml`
5. **Implement Basic Middleware:** Domain routing logic
6. **Create First Test:** E2E test for multi-tenant rendering

---

**Last Updated:** February 4, 2026  
**Version:** 1.0 (Initial Architecture)  
**Maintained By:** Davis Jones  
**Next Review:** Post-Phase 1 Infrastructure Build
