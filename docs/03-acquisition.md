# 03 - Acquisition Data Model

All code interacting with the growth data model should rely strictly on the `GrowthService` inside `lib/dbServices/growthService.js`.

**Purpose**: This specification details the schemas used for acquiring, tracking, and engaging prospects generated from automated multi-channel growth experiments.

---

## The `campaigns` Collection

Defines an overarching acquisition experiment. These represent the "Channels" described in the Growth Experiments roadmap.

- **Collection Path**: `/campaigns/{campaignId}`
- **Security**: Admin-only (no public access, strict IAM requirements).

### Schema (Document Structure)

```javascript
{
  id: "str_uuid",                   // Auto-generated ID
  name: "Denton Farmer's Market",   // Human-readable name
  type: "LegalTech",                // Pipeline Type (e.g. LegalTech, DayZero, DigitalRescue, SMSVision, TrojanHorse)
  status: "active",                 // Enum: "active", "paused", "completed"
  metrics: {
    identified: 120,                // Total number of prospects identified
    contacted: 45,                  // Total outreach sent
    site_generated: 45,             // Number of initial staging sites built
    claimed: 12,                    // Number of sites successfully claimed
    rejected: 3                     // Number of explicit rejections or invalid leads
  },
  createdAt: "timestamp",           // Creation date
  updatedAt: "timestamp"            // Last modified date
}
```

---

## The `leads` Collection

Tracks individual prospects acquired through a specific campaign. A lead represents a targeted business or individual moving through the acquisition pipeline.

- **Collection Path**: `/leads/{leadId}`
- **Security**: Admin-only.

### Schema (Document Structure)

```javascript
{
  id: "str_uuid",                   // Auto-generated ID
  campaignId: "str_campaign_uuid",  // Reference to the parent campaign
  businessName: "Sarah's Soaps",    // Extracted business name
  contactInfo: {
    email: "sarah@example.com",     // If found/scraped
    phone: "512-555-0199",          // If found/scraped
    social: "@sarahs_soaps",        // Instagram, Facebook handle
    address: {                      // Primarily for the DayZero pipeline
      street: "123 Market St",
      city: "San Marcos",
      state: "TX",
      zip: "78666"
    }
  },
  sourceData: {                     // Raw, unstructured payload saved for context/debugging
    // e.g., raw PDF scrape, raw API response from lob, original SMS message
  },
  siteId: "str_site_uuid",          // Reference to `sites/{siteId}` if a Staging Node was created
  status: "site_generated",         // Enum tracking pipeline progress
                                    // Valid States:
                                    // 1. "identified"     -> Extracted from a list/registry
                                    // 2. "contacted"      -> Outreach initiated (DM, Postcard, Email)
                                    // 3. "site_generated" -> Auto-generated proxy node built
                                    // 4. "claimed"        -> Vendor successfully took ownership
                                    // 5. "rejected"       -> Invalid contact, user opting out
  createdAt: "timestamp",           // Creation date
  updatedAt: "timestamp"            // Last modified date
}
```

---

## Metric Roll-up Strategy

To prevent expensive aggregation queries across the `leads` collection, metrics on the `campaigns` collection are maintained via Cloud Functions (or transactionally, depending strictly on the Phase 6 CRM capabilities).

**Rule of Thumb:** If `growthService.updateLeadStatus` transitions a lead from `"contacted"` to `"site_generated"`, the service should increment `campaign.metrics.site_generated` within the same atomic batch operation or rely on a Firebase Cloud Function for eventually consistent metric aggregation.
