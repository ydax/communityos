/**
 * Digital Rescue Pipeline — Orchestrator
 * @module pipelines/digital-rescue
 *
 * Runs the 4-step Digital Rescue pipeline across all configured I-35 corridor locations.
 * Per-business errors are caught and logged without halting the rest of the run.
 *
 * USAGE:
 *   import { runDigitalRescuePipeline } from '@/lib/pipelines/digital-rescue';
 *   const summary = await runDigitalRescuePipeline({ campaignId: 'your-campaign-id' });
 *
 * KILL SWITCH:
 *   Set ENABLE_DIGITAL_RESCUE_PIPELINE=false in .env to halt all runs immediately.
 */

import { Client as MapsClient } from "@googlemaps/google-maps-services-js";
import { adminDb } from "@/lib/firebase/admin";
import * as growthService from "@/lib/dbServices/growthService.js";
import * as siteGenerator from "@/lib/aiServices/siteGenerator.js";

import {
  PIPELINE_ENABLED,
  CORRIDOR_LOCATIONS,
  SEARCH_RADIUS_METERS,
  BUSINESS_TYPES,
  MAX_RESULTS_PER_LOCATION,
  MIN_RATING,
  MIN_REVIEW_COUNT,
  BAD_WEBSITE_PATTERNS,
  WEBSITE_CHECK_TIMEOUT_MS,
} from "./config.js";

import { searchBusinesses } from "./steps/01-search.js";
import { checkWebsiteHealth } from "./steps/02-check.js";
import { synthesizeProfile } from "./steps/03-profile.js";
import { stageLeadAndSite } from "./steps/04-stage.js";

/**
 * Gemini API call helper. Mirrors the pattern used in the existing siteGenerator route.
 * Injected into steps to keep them testable without live API calls.
 */
async function callGemini(systemPrompt, userPrompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GENAI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      }),
    },
  );
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Run the full Digital Rescue pipeline.
 *
 * @param {Object} params
 * @param {string} params.campaignId - The Firestore campaign ID to attribute leads to
 * @param {Object} [params._inject] - Optional dep injection override for testing
 * @returns {Promise<{ processed: number, staged: number, skipped: number, errors: number }>}
 */
export async function runDigitalRescuePipeline({ campaignId, _inject = {} }) {
  if (!PIPELINE_ENABLED) {
    console.log(
      "[digital-rescue] Pipeline disabled via ENABLE_DIGITAL_RESCUE_PIPELINE env var. Exiting.",
    );
    return { processed: 0, staged: 0, skipped: 0, errors: 0 };
  }

  if (!campaignId)
    throw new Error("campaignId is required to run the pipeline");

  // Allow dependency injection for testing
  const deps = {
    mapsClient: _inject.mapsClient || new MapsClient({}),
    growthService: _inject.growthService || growthService,
    siteGenerator: _inject.siteGenerator || siteGenerator,
    callGemini: _inject.callGemini || callGemini,
    adminDb: _inject.adminDb || adminDb,
  };

  const summary = { processed: 0, staged: 0, skipped: 0, errors: 0 };

  for (const location of CORRIDOR_LOCATIONS) {
    console.log(`[digital-rescue] Searching ${location.name}...`);

    let places = [];
    try {
      places = await searchBusinesses({
        mapsClient: deps.mapsClient,
        location,
        radius: SEARCH_RADIUS_METERS,
        types: BUSINESS_TYPES,
        maxResults: MAX_RESULTS_PER_LOCATION,
      });
    } catch (err) {
      console.error(
        `[digital-rescue] Search failed for ${location.name}:`,
        err.message,
      );
      summary.errors++;
      continue;
    }

    // Filter by minimum quality thresholds before hitting the API for each place
    const qualityFiltered = places.filter(
      (p) =>
        (p.rating === null || p.rating >= MIN_RATING) &&
        p.userRatingsTotal >= MIN_REVIEW_COUNT,
    );

    console.log(
      `[digital-rescue] ${location.name}: ${places.length} found, ${qualityFiltered.length} passed quality filter`,
    );

    for (const place of qualityFiltered) {
      const stepStart = Date.now();
      summary.processed++;

      try {
        // Step 02: Check website health
        const checkResult = await checkWebsiteHealth({
          place,
          badWebsitePatterns: BAD_WEBSITE_PATTERNS,
          timeoutMs: WEBSITE_CHECK_TIMEOUT_MS,
        });

        if (!checkResult.qualifies) {
          summary.skipped++;
          log({
            step: "02-check",
            placeId: place.placeId,
            status: "healthy_skip",
            durationMs: elapsed(stepStart),
          });
          continue;
        }

        log({
          step: "02-check",
          placeId: place.placeId,
          status: "qualified",
          reason: checkResult.reason,
          durationMs: elapsed(stepStart),
        });

        // Step 03: Synthesize profile
        const profile = await synthesizeProfile({
          place,
          mapsClient: deps.mapsClient,
          callGemini: deps.callGemini,
        });

        log({
          step: "03-profile",
          placeId: place.placeId,
          status: "done",
          category: profile.category,
          durationMs: elapsed(stepStart),
        });

        // Step 04: Stage lead and site
        const stageResult = await stageLeadAndSite({
          place,
          profile,
          checkResult,
          campaignId,
          growthService: deps.growthService,
          siteGenerator: deps.siteGenerator,
          callGemini: deps.callGemini,
          adminDb: deps.adminDb,
        });

        if (stageResult.staged) {
          summary.staged++;
          log({
            step: "04-stage",
            placeId: place.placeId,
            status: "staged",
            leadId: stageResult.leadId,
            siteId: stageResult.siteId,
            durationMs: elapsed(stepStart),
          });
        } else {
          summary.skipped++;
          log({
            step: "04-stage",
            placeId: place.placeId,
            status: "skipped",
            reason: stageResult.skippedReason,
            durationMs: elapsed(stepStart),
          });
        }
      } catch (err) {
        summary.errors++;
        console.error(
          `[digital-rescue] Unhandled error for ${place.placeId}:`,
          err.message,
        );
      }
    }
  }

  console.log("[digital-rescue] Run complete:", summary);
  return summary;
}

/** Structured log helper — JSON for future Cloud Logging compatibility */
function log(fields) {
  console.log(JSON.stringify({ pipeline: "digital-rescue", ...fields }));
}

/** Elapsed time helper */
function elapsed(start) {
  return Date.now() - start;
}
