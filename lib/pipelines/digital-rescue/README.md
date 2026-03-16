# Digital Rescue Pipeline — Runbook

## What It Does

Queries Google Places API across 5 I-35 corridor cities for businesses with broken/missing web presence, auto-generates a staging site, and records a trackable lead in the Growth Dashboard.

## Prerequisites

Add to your `.env.local`:

```
GOOGLE_PLACES_API_KEY=your_key_here
ENABLE_DIGITAL_RESCUE_PIPELINE=true
```

## How to Trigger a Run

```bash
# First, create a Campaign in Firestore via the Admin Dashboard, then:
curl -X POST "http://localhost:3000/api/pipelines/digital-rescue/run?campaignId=YOUR_CAMPAIGN_ID"
```

Or use the **"Run Pipeline"** button on `/admin/growth`.

## How to Pause It

Set `ENABLE_DIGITAL_RESCUE_PIPELINE=false` in your `.env.local` and redeploy.  
No code changes required.

## How to Deprecate It

1. Set `ENABLE_DIGITAL_RESCUE_PIPELINE=false`
2. Delete `lib/pipelines/digital-rescue/` (this directory)
3. Delete `app/api/pipelines/digital-rescue/`
4. Archive the Campaign in the Growth Dashboard

## Pipeline Steps

| Step | File                  | What It Does                                                 |
| ---- | --------------------- | ------------------------------------------------------------ |
| 01   | `steps/01-search.js`  | Google Places Nearby Search across I-35 corridor             |
| 02   | `steps/02-check.js`   | Pings website URL — flags 404, DNS fail, Wix, no site        |
| 03   | `steps/03-profile.js` | Fetches reviews via Places Details + Gemini story synthesis  |
| 04   | `steps/04-stage.js`   | Creates staging site in Firestore + lead in Growth Dashboard |

## Idempotency

The pipeline deduplicates on `sourceData.placeId`. Running it twice on the same corridor will not create duplicate leads or sites.

## Config

All tunable parameters (Cities, radius, business types, quality thresholds) are in `config.js`.
