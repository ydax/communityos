# PROMPT: Demo Site Strategy for CentralTexas.com Multi-Tenant Platform

## YOUR TASK

I need your strategic recommendation on how to set up **3 demo/spec sites** for my multi-tenant marketplace platform. These sites should demonstrate the technology's capabilities to potential customers and investors without requiring custom infrastructure for each demo. The sites should feel like real businesses but exist within our existing infrastructure.

---

## BUSINESS CONTEXT

### What CentralTexas.com Is

CentralTexas.com is a **"SaaS-Enabled Marketplace"** that uses a "Trojan Horse" strategy:

1. **The Hook:** We offer free, beautiful custom-domain websites to local service providers (e.g., `JoesFencing.com`)
2. **The Secret:** When providers publish their site, structured inventory appears in TWO places:
   - Their private site (solves their web presence problem)
   - Our marketplace at `CentralTexas.com` (solves our supply problem)

### Current Status

- **Phase 1-3:** COMPLETE ✅ (February 2026)
- **Infrastructure:** Production-ready multi-tenant Next.js platform deployed on Vercel + Firebase
- **Admin Tools:** Fully functional Item Library, Variant Editor, Site Editor
- **Testing:** 47+ passing unit tests, comprehensive E2E test suite
- **Current Phase:** Phase 4 - "Ghost Agency" Operations (preparing to gift sites to real vendors)

### Strategic Constraints

1. **Vertical Focus:** Home Services first (Fencing, Plumbing, Landscaping, HVAC, Electrical, etc.) to achieve marketplace liquidity
2. **Geographic Focus:** I-35 Innovation Corridor (Austin ↔ San Antonio)
3. **Revenue Model:** 10% transaction fee OR $29/mo subscription for high-volume sellers
4. **Acquisition Strategy:** "Ghost Agency" - we pre-build sites and gift them to service providers

---

## TECHNICAL ARCHITECTURE

### Technology Stack

- **Frontend:** Next.js 15 (App Router) + React + Tailwind CSS
- **Backend:** Firebase (Firestore + Auth + Cloud Functions + Storage)
- **Deployment:** Vercel with multi-tenant middleware
- **Language:** JavaScript ONLY (no TypeScript)
- **Testing:** Vitest (unit) + Cypress (E2E)

### Multi-Tenant Infrastructure

**How it works:**
- Single Next.js codebase serves multiple domains via middleware
- Middleware performs domain lookup in Firestore to determine which "site" to load
- Each tenant gets their own custom domain (e.g., `joesfencing.com`) OR subdomain (e.g., `joes-fencing.centraltexas.com`)
- Custom domains require DNS configuration (CNAME to Vercel)
- Subdomains work automatically with wildcard SSL

**Current Capabilities:**
- Domain caching (5-min TTL, ~90% cost reduction)
- Structured logging with request IDs
- Performance metrics tracking
- Support for both custom domains and `*.centraltexas.com` subdomains

### Data Model

**Core Collections:**

1. **sites** - Multi-tenant site configurations
   ```javascript
   {
     id: "site_12345",
     domain: "joesfencing.com",
     subdomain: "joes-fencing", // Optional fallback
     businessName: "Joe's Fencing",
     theme: "trade", // "maker", "trade", or "venue"
     sections: [
       { type: "hero", visible: true, content: {...} },
       { type: "services", visible: true, content: {...} },
       { type: "about", visible: true, content: {...} },
       { type: "contact", visible: true, content: {...} }
     ],
     ownerId: "user_abc",
     createdAt: timestamp,
     status: "active" // "active", "draft", "archived"
   }
   ```

2. **listings** - Top-level items (Services OR Goods)
   ```javascript
   {
     id: "listing_67890",
     siteId: "site_12345",
     title: "Cedar Fence Installation",
     description: "...",
     type: "service", // "service" or "good"
     category: "fencing",
     pricing: {
       model: "fixed", // "fixed", "hourly", "quote"
       amount: 5000,
       unit: "project" // "project", "hour", "item"
     },
     images: ["url1", "url2"],
     status: "active",
     createdAt: timestamp
   }
   ```

3. **variants** - SKU-level details (for Goods OR Service tiers)
   ```javascript
   {
     id: "variant_111",
     listingId: "listing_67890",
     name: "6ft Cedar Fence - Premium",
     sku: "FENCE-CEDAR-6FT-PREM",
     price: 5500,
     options: { height: "6ft", grade: "premium" },
     inventoryTracked: false // Services typically false
   }
   ```

4. **inventory** - Stock counts with audit trail (primarily for Goods)
5. **orders** - Transaction records linked to Stripe Payment Intents

**Critical Pattern:** The system supports BOTH Services (Fence Repair - $50/hr) AND Goods (T-shirts with Red/Blue variants), but our MVP focuses on Services.

---

## ADMIN TOOLS (What We've Built)

### Item Library (`/admin/listings`)
- Square-style grid view of all listings
- Advanced filters (search, type, status)
- Create/Edit dialogs with form validation
- Hover actions for Edit, Duplicate, Archive

### Variant Editor (`/admin/listings/[listingId]/variants`)
- Variant table with Name, SKU, Price, Inventory, Status
- Auto-generation of variant names/SKUs from options
- Inline inventory adjustment with audit trail

### Site Editor (`/admin/sites/[siteId]/editor`)
- Section-based editor (NO drag-and-drop by design)
- Section list with visibility toggles and reordering
- Dynamic form editor that adapts to section type
- Live preview panel
- Theme selector (3 presets: "The Maker", "The Trade", "The Venue")

**Key Workflow:**
1. Admin goes to `/admin/sites/[siteId]/editor`
2. Configures sections (Hero, Services, About, Contact)
3. Selects theme
4. Saves
5. Site is immediately live at tenant's domain

---

## CURRENT OPERATIONAL MODEL ("Ghost Agency")

**The "Ghost Agency" Flow:**

1. **I** (the platform owner) manually build a site for a service provider using admin tools
2. **I** buy their domain for them (optional, ~$12/year)
3. **I** configure DNS to point to Vercel
4. **I** DM them: "I built this for you. It's free. Here's the login."
5. Provider accepts, starts managing their own content
6. Their inventory auto-populates the CentralTexas.com marketplace

**Constraints:**
- Build time target: < 10 mins per site
- Quality target: 80%+ items with structured variants (not free text)
- Initial target: 50 active custom domains

---

## THE CHALLENGE: Demo Sites Without Custom Infrastructure

### The Problem

I need to demonstrate this technology to:
- **Potential customers** (service providers): "This is what your site could look like"
- **Potential investors**: "This is a working multi-tenant platform with real inventory"
- **Potential partners**: "This is how the marketplace aggregates supply"

But I don't want to:
- Set up real businesses with real transactions
- Buy dozens of custom domains for fake businesses
- Create elaborate fake data that looks obviously fake
- Manage complex infrastructure just for demos

### What I Need From You

**Provide a strategic recommendation for setting up 3 demo sites that:**

1. **Feel Real:** Business names, services, pricing, and imagery feel authentic
2. **Show Diversity:** Demonstrate different service categories within Home Services vertical
3. **Showcase Features:** Each site should highlight different platform capabilities
4. **Are Low-Maintenance:** Easy to set up, minimal ongoing updates needed
5. **Work Within Constraints:** Use subdomains (`*.centraltexas.com`) instead of custom domains if that's simpler
6. **Demonstrate Marketplace:** Show how inventory from these 3 sites would appear in the marketplace feed

---

## WHAT I NEED YOU TO RECOMMEND

### 1. Demo Site Selection Strategy

**Recommend 3 specific home service businesses:**
- What business types? (e.g., Fencing, Plumbing, Landscaping, HVAC, Electrical, Pool Service, etc.)
- Why these specific three? (What does each demonstrate about the platform?)
- What geographic locations within Austin-San Antonio corridor?

### 2. Domain/Subdomain Strategy

**Should I use:**
- Custom domains (e.g., `joesfencing.com`)? If so, do I buy real domains or use expired/available ones?
- Subdomains (e.g., `joes-fencing.centraltexas.com`)? 
- A mix of both to demonstrate both capabilities?

**Considerations:**
- Custom domains require DNS setup but look more "real"
- Subdomains work immediately but might look like demos
- I don't want to mislead people that these are real businesses operating

### 3. Business Profile Design

**For each of the 3 businesses, recommend:**
- Business name
- Tagline/positioning
- 3-5 core services with realistic pricing
- "About Us" story that feels authentic but is clearly fictional
- Which theme to use ("Maker", "Trade", or "Venue")
- Sample imagery strategy (stock photos? AI-generated? Where to source?)

### 4. Inventory Structure

**For each business, recommend:**
- How many services/listings to create
- Whether to use variants (e.g., "Basic vs Premium" service tiers)
- Pricing strategy that feels realistic for the Austin-San Antonio market
- Categories/tags to use for marketplace organization

### 5. Marketplace Demonstration Strategy

**How do I showcase the marketplace aggregation?**
- Should I create a "Demo" section on CentralTexas.com that shows these 3 sites?
- Should I integrate them into the real marketplace with a "Demo" badge?
- How do I make it clear these are demos without diminishing their credibility?

### 6. Data Authenticity vs. Transparency

**How do I balance "feeling real" with "being honest"?**
- Should the sites have disclaimers that they're demos?
- Should the business names be obviously fictional (e.g., "Acme Fencing") or realistic (e.g., "Hill Country Fence Co.")?
- What legal/ethical considerations should I keep in mind?

### 7. Demo Script/Story

**When showing these sites to stakeholders:**
- What narrative should I use? ("These are example sites..." vs "Meet Joe, a local fencing contractor...")
- What should I emphasize about each site?
- What user flows should I demonstrate? (Building a site? Managing inventory? Customer browsing marketplace?)

---

## CONSTRAINTS & CONSIDERATIONS

### Technical Constraints

- Platform is production-ready but not yet at scale
- Multi-tenant infrastructure works perfectly
- Admin tools require manual operation (no self-service signup yet)
- Payment processing (Stripe) is configured but not battle-tested
- DNS setup for custom domains takes 24-48 hours

### Business Constraints

- I'm a solo founder (no team to manage demos)
- Budget-conscious (don't want to spend $100s on demo domains)
- Time-constrained (want to set these up quickly)
- Need demos to last months/years without maintenance

### Legal/Ethical Constraints

- Don't want to mislead anyone that these are real operating businesses
- Don't want to violate trademark/business name rules
- Need to comply with any relevant consumer protection laws
- Should be transparent about demo status when asked directly

---

## SUCCESS CRITERIA

**Your recommendation should enable me to:**

1. Set up 3 demo sites in under 2 hours total
2. Demonstrate the platform's capabilities to diverse audiences
3. Show realistic use cases without legal/ethical issues
4. Maintain demos with minimal effort over 6-12 months
5. Optionally convert these demos into templates/starter sites for real customers

---

## ADDITIONAL CONTEXT

### The "Anti-Design" Philosophy

One of our core differentiators is that we **don't** give users full design control. We provide:
- 3 rigid themes (can't customize colors/fonts)
- Section-based editing (can't drag-and-drop)
- Content controls only (can't break layouts)

**Why?** Most service providers want a "professional site that just works," not a design tool. Our demos should showcase this constraint as a feature, not a bug.

### The Marketplace Discovery Model

Discovery radius depends on category:
- **Hyper-Local (0-10mi):** Services like Plumbing, HVAC (emergency services)
- **Corridor Commute (I-35 Axis):** Services like Custom Fabrication, Specialized Contractors
- Feed shows nearest providers first, with programmatic SEO cards when density is low

Your demo site recommendations should consider how they'd appear in marketplace search/discovery.

---

## OUTPUT FORMAT REQUESTED

Please structure your response with:

1. **Executive Summary:** High-level strategy recommendation (2-3 paragraphs)

2. **The Three Demo Sites:** Detailed specs for each:
   - Business name & tagline
   - Service category & why you chose it
   - Domain strategy (custom vs subdomain)
   - Theme selection
   - 3-5 core services with pricing
   - About Us story
   - Imagery strategy
   - Inventory structure

3. **Marketplace Integration:** How to position these demos in the CentralTexas.com marketplace

4. **Legal/Ethical Guidelines:** How to label/disclose these as demos

5. **Setup Checklist:** Step-by-step process to implement your recommendations

6. **Demo Script:** Talking points for showing these sites to different audiences (customers, investors, partners)

7. **Maintenance Plan:** How to keep these demos fresh over time

8. **Future Path:** How to potentially convert these demos into templates or real customer sites

---

## WHY THIS MATTERS

I'm at an inflection point: the platform is technically ready, but I need to start showing it to real people. Demo sites bridge the gap between "empty platform" and "real customer sites" without the chicken-and-egg problem.

Your recommendation will directly influence:
- How I pitch this platform to service providers
- Whether investors understand the vision
- How quickly I can onboard real customers (using demos as templates)

Thank you for your strategic thinking on this!

---

**Date:** February 11, 2026  
**Platform Status:** Phase 3 Complete, Phase 4 (Ghost Agency) Ready to Launch  
**Production URL:** https://centraltexas.com  
**Documentation:** See attached context files for full technical/business details
