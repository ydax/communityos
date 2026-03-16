/**
 * Step 04 — Stage Lead & Site
 * @module pipelines/digital-rescue/steps/04-stage
 *
 * The terminal step of the pipeline. Given a qualified place and a synthesized
 * business profile, this step:
 *   1. Deduplicates — skips if a lead with this placeId already exists.
 *   2. Generates a SiteConfig via siteGenerator.
 *   3. Creates a staging Site in Firestore (status: "staging", not public).
 *   4. Creates a Lead in the Growth Dashboard via growthService.
 *
 * CONTRACT:
 *   Input:  { place, profile, checkResult, campaignId, growthService, siteGenerator, callGemini, adminDb }
 *   Output: { staged: boolean, leadId: string|null, siteId: string|null, skippedReason: string|null }
 */

import { LEAD_STATUS } from "@/lib/dbServices/growthService.js";

/**
 * Stage a rescue site and create a trackable lead.
 *
 * @param {Object} params
 * @param {Object} params.place - Normalized place from step 01
 * @param {Object} params.profile - { businessStory, category } from step 03
 * @param {Object} params.checkResult - { reason } from step 02
 * @param {string} params.campaignId - Firestore campaign ID to attribute this lead to
 * @param {Object} params.growthService - Injected growthService module
 * @param {Object} params.siteGenerator - Injected siteGenerator module
 * @param {Function} params.callGemini - Injected Gemini call function
 * @param {Object} params.adminDb - Injected Firebase Admin Firestore instance
 * @returns {Promise<{ staged: boolean, leadId: string|null, siteId: string|null, skippedReason: string|null }>}
 */
export async function stageLeadAndSite({
  place,
  profile,
  checkResult,
  campaignId,
  growthService,
  siteGenerator,
  callGemini,
  adminDb,
}) {
  // --- Idempotency Check ---
  // If a lead already exists for this placeId, skip silently.
  const existingLeadSnap = await adminDb
    .collection("leads")
    .where("sourceData.placeId", "==", place.placeId)
    .limit(1)
    .get();

  if (!existingLeadSnap.empty) {
    return {
      staged: false,
      leadId: null,
      siteId: null,
      skippedReason: `duplicate_place_id:${place.placeId}`,
    };
  }

  // --- Generate SiteConfig ---
  const siteGenResult = await siteGenerator.generateSiteConfig(
    {
      businessName: place.name,
      businessStory: profile.businessStory,
      category: profile.category,
      vibePreset: "bold-craftsman", // Default vibe for rescue sites
    },
    { callGemini },
  );

  if (!siteGenResult.success) {
    console.error(
      `[digital-rescue][04-stage] siteGenerator failed for ${place.placeId}:`,
      siteGenResult.error,
    );
    return {
      staged: false,
      leadId: null,
      siteId: null,
      skippedReason: `site_gen_failed:${siteGenResult.error}`,
    };
  }

  // --- Create Staging Site in Firestore ---
  // Sites with status "staging" are invisible to the public multi-tenant middleware.
  // They become "active" only when the vendor claims them via magic link.
  const slugifiedName = place.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const stagingSubdomain = `${slugifiedName}.centraltexas.com`;
  const newSiteRef = adminDb.collection("sites").doc();

  const siteData = {
    id: newSiteRef.id,
    businessName: place.name,
    domain: stagingSubdomain,
    status: "staging", // Not visible to the public
    config: siteGenResult.config,
    ownerId: null, // Populated when vendor claims
    pipelineSource: "digital-rescue",
    placeId: place.placeId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await newSiteRef.set(siteData);

  // --- Create Lead in Growth Dashboard ---
  const leadId = await growthService.createLead(campaignId, {
    businessName: place.name,
    contactInfo: {
      // We don't have contact info at this stage — outreach step (future) will fill this
    },
    sourceData: {
      placeId: place.placeId,
      name: place.name,
      vicinity: place.vicinity,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      website: place.website,
      rescueReason: checkResult.reason,
    },
    siteId: newSiteRef.id,
    status: LEAD_STATUS.SITE_GENERATED,
  });

  return {
    staged: true,
    leadId,
    siteId: newSiteRef.id,
    skippedReason: null,
  };
}
