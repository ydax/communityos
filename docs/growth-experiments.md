# CentralTexas.com Growth Experiments Roadmap

This document outlines constraint-based, highly automated customer acquisition pipelines for CentralTexas.com. By dropping the requirement for human sales, we can build **Asymmetric Acquisition Engines**. The core philosophy: **Do not ask users to build a profile. Use code to build it for them, and ask them to claim it.**

All acquisition funnels route into a "Radical Honesty Video Gate"—a 45-second video managing expectations that the platform is 100% self-serve to remain free.

---

## 🧪 Pipeline 1: The "Legal Tech" Pivot (Unstructured Local Data)

Leveraging unstructured data extraction to capture event vendors.

- **The Target:** Local event organizers (San Marcos Farmer's Market, Sights & Sounds of Christmas, Pecan Fest) who publish vendor lists in PDFs, images, or static HTML tables.
- **The Engine:**
  - Cron job monitors local event sites for vendor list drops.
  - Generative AI extracts vendor names from unstructured formats.
  - Search API (SerpApi/Hunter.io) finds email or Instagram handles.
- **The Synthesis:** LLM reads social media bio to write an SEO-optimized "About Us" and infer top 3 products. Backend spins up a staging node (`centraltexas.com/staging/vendor-name`).
- **The Outreach:** Automated DM/Email with a magic link: _"Because I want locals to find you after the festival, my script built you a free digital storefront... click to claim it."_
- **Status:** 🔲 NOT STARTED

---

## 🧪 Pipeline 2: The "Day Zero" Intercept (Public Records to Physical API)

Capturing new businesses the moment they legally form, before they use out-of-state SaaS.

- **The Target:** Texas Comptroller (Sales Tax Permits), Health Departments (Cottage/Mobile Food), County Clerk (DBAs) records updated weekly.
- **The Engine:** Python scraper pulling new business names and physical mailing addresses every Friday.
- **The Physical Bridge:** Integration with Lob API or PostGrid (~$0.60/call) to automatically print and mail physical postcards.
- **The Experience:** Postcard arrives the week the business is legal, containing a unique QR code. Scanning the QR auto-logs them into a pre-generated CentralTexas.com node.
- **Status:** 🔲 NOT STARTED

---

## 🧪 Pipeline 3: The "Digital Rescue" Crawler (Google Places API)

Identifying businesses penalized by Google for broken web presence and offering an instant fix.

- **The Target:** Businesses within a 30-mile radius with a 404, DNS failure, or `.wixsite.com` linked to their Google profile.
- **The Engine:** Google Places API scraper that pings `website` URLs and flags dead or suboptimal links.
- **The Synthesis:** LLM uses Google Reviews and basic info to map out a highly localized profile.
- **The Outreach:** Automated outreach: _"I noticed the website on your Google Maps profile is dead... my system generated a free, permanently hosted backup storefront for you."_
- **Status:** 🔲 NOT STARTED

---

## 🧪 Pipeline 4: The SMS Vision Concierge (Zero-UI Onboarding)

Eliminating the desktop computer entirely for on-the-go micro-businesses.

- **The Distribution:** Cheap yard signs, localized TikTok ads, email signatures: _"Get a free local website in 60 seconds. Text 'LOCAL' to 512-XXX-XXXX."_
- **The Engine:** Twilio SMS API integrated with OpenAI's Vision API.
- **The Experience:**
  - Vendor texts "LOCAL".
  - AI Bot asks for a picture of a physical menu, flyer, or products.
  - Vision API extracts handwriting, items, and pricing.
  - AI Bot replies instantly with the live URL, allowing future updates via SMS.
- **Status:** 🔲 NOT STARTED

---

## 🧪 Pipeline 5: The "Trojan Horse" Utility (Product-Led Inbound)

Building hyper-specific micro-tools that solve painful local problems, collecting directory listings at the final step.

- **The Engine:** Single-page web apps hosted on the domain.
  - `centraltexas.com/qr` (Free, branded QR menu generator for food trucks).
  - `centraltexas.com/zoning-ai` (AI chatbot trained on San Marcos municipal code for permitting questions).
- **The Lock-In:** To get the final PDF or utility, users enter their business info. The script solves their problem while silently building their marketplace Node.
- **Status:** 🔲 NOT STARTED

---

## 🚧 Core Infrastructure Additions Requirements

Before launching these pipelines, we will need:

1. **The "Radical Honesty" Video Gate:** The interstitial page where the founder sets expectations (100% self-serve, no human support) before a user claims a pre-generated node.
2. **Staging Nodes Support:** The ability to generate a site in a "Hidden/Staging" status that only becomes public once claimed and verified by the human.
3. **Magic Link / QR Claim Auth:** A seamless authentication flow that transitions a staging site to an owned site via unique URL parameters.

---

## 📊 Section 6: Campaign Data & Telemetry

To measure the health of these asymmetric acquisition engines, we are implementing a strictly structured tracking layer under `/campaigns` and `/leads` in Firestore.

- **Data Definition**: Detailed schema and field types are defined in `docs/central-texas/03-acquisition.md`.
- **System Constraints**: All interactions with growth data MUST pass through `lib/dbServices/growthService.js` to ensure telemetry consistency.

### Tracking the Pipeline

Each `lead` acquired through these experiments moves through the following tracked statuses:

1. `identified` - Record scraped from registries, event lists, or API calls.
2. `contacted` - Mail sent, DM fired, or sequence initiated.
3. `site_generated` - Our engine synthesized their proxy Node.
4. `claimed` - The business owner adopted the platform.
5. `rejected` - Bounce, wrong number, or opt-out.

These metrics roll up into individual `campaign` records to power our administrative health dashboard (`/admin/growth`), giving us immediate visibility into which automated pipeline converts best.
