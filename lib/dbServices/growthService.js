/**
 * Growth Service
 * @module dbServices/growthService
 *
 * Handles CRUD operations for Campaigns and Leads to support localized asymmetric acquisition pipelines.
 * Uses Firebase Admin SDK — server-side only. Use from API routes, not directly in client components.
 */

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Valid lead statuses based on the 03-acquisition schema
 */
export const LEAD_STATUS = {
  IDENTIFIED: "identified", // Extracted/scraped
  CONTACTED: "contacted", // DM/Postcard sent
  SITE_GENERATED: "site_generated", // Staging proxy node created
  CLAIMED: "claimed", // Vendor claimed site
  REJECTED: "rejected", // Opt-out or invalid
};

/**
 * Valid campaign statuses
 */
export const CAMPAIGN_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
};

/**
 * Creates a new growth campaign
 *
 * @param {Object} campaignData - The campaign configuration
 * @param {string} campaignData.name - Internal name (e.g. "Denton Farmer's Market")
 * @param {string} campaignData.type - Pipeline Type (e.g., "LegalTech")
 * @returns {Promise<string>} The created campaign ID
 */
export async function createCampaign(campaignData) {
  const newCampaignRef = adminDb.collection("campaigns").doc();

  const campaign = {
    id: newCampaignRef.id,
    name: campaignData.name,
    type: campaignData.type,
    status: campaignData.status || CAMPAIGN_STATUS.ACTIVE,
    metrics: {
      identified: 0,
      contacted: 0,
      site_generated: 0,
      claimed: 0,
      rejected: 0,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await newCampaignRef.set(campaign);
  return campaign.id;
}

/**
 * Fetches all campaigns, ordered by creation date
 *
 * @returns {Promise<Array>} Array of campaign objects
 */
export async function getCampaigns() {
  const snapshot = await adminDb
    .collection("campaigns")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
    };
  });
}

/**
 * Gets a specific campaign by ID
 *
 * @param {string} campaignId
 * @returns {Promise<Object|null>}
 */
export async function getCampaign(campaignId) {
  if (!campaignId) return null;

  const snapshot = await adminDb.collection("campaigns").doc(campaignId).get();
  if (!snapshot.exists) return null;

  const data = snapshot.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
  };
}

/**
 * Creates a new lead tied to a campaign
 * Uses a Firestore transaction to atomically increment campaign metrics.
 *
 * @param {string} campaignId - The parent campaign ID
 * @param {Object} leadData - Information about the lead
 * @returns {Promise<string>} The new lead ID
 */
export async function createLead(campaignId, leadData) {
  if (!campaignId) throw new Error("Campaign ID is required to create a lead");
  if (!leadData.businessName) throw new Error("Business name is required");

  const baseStatus = leadData.status || LEAD_STATUS.IDENTIFIED;
  const newLeadRef = adminDb.collection("leads").doc();
  const campaignRef = adminDb.collection("campaigns").doc(campaignId);

  await adminDb.runTransaction(async (transaction) => {
    const campaignDoc = await transaction.get(campaignRef);
    if (!campaignDoc.exists) {
      throw new Error(`Campaign ${campaignId} does not exist`);
    }

    const lead = {
      id: newLeadRef.id,
      campaignId,
      businessName: leadData.businessName,
      contactInfo: leadData.contactInfo || {},
      sourceData: leadData.sourceData || {},
      siteId: leadData.siteId || null,
      status: baseStatus,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const currentMetrics = campaignDoc.data().metrics || {};
    const newMetrics = { ...currentMetrics };
    if (newMetrics[baseStatus] !== undefined) {
      newMetrics[baseStatus] += 1;
    }

    transaction.set(newLeadRef, lead);
    transaction.update(campaignRef, {
      metrics: newMetrics,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return newLeadRef.id;
}

/**
 * Fetches all leads for a specific campaign
 *
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export async function getLeadsByCampaign(campaignId) {
  if (!campaignId) return [];

  const snapshot = await adminDb
    .collection("leads")
    .where("campaignId", "==", campaignId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
    };
  });
}

/**
 * Updates a lead's status, keeping campaign metrics in sync.
 *
 * @param {string} leadId - The ID of the lead to update
 * @param {string} newStatus - The new LEAD_STATUS value
 * @param {Object} updates - Additional fields to update (e.g. siteId)
 * @returns {Promise<boolean>}
 */
export async function updateLeadStatus(leadId, newStatus, updates = {}) {
  if (!leadId || !newStatus)
    throw new Error("Lead ID and new status are required");
  if (!Object.values(LEAD_STATUS).includes(newStatus)) {
    throw new Error(`Invalid lead status: ${newStatus}`);
  }

  const leadRef = adminDb.collection("leads").doc(leadId);

  await adminDb.runTransaction(async (transaction) => {
    const leadDoc = await transaction.get(leadRef);
    if (!leadDoc.exists) throw new Error(`Lead ${leadId} not found`);

    const leadData = leadDoc.data();
    const oldStatus = leadData.status;
    const campaignId = leadData.campaignId;

    // If status hasn't changed, just patch other fields
    if (oldStatus === newStatus) {
      transaction.update(leadRef, {
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    const campaignRef = adminDb.collection("campaigns").doc(campaignId);
    const campaignDoc = await transaction.get(campaignRef);
    if (!campaignDoc.exists)
      throw new Error(`Campaign ${campaignId} not found`);

    const currentMetrics = campaignDoc.data().metrics || {};
    const newMetrics = { ...currentMetrics };
    if (newMetrics[oldStatus] !== undefined && newMetrics[oldStatus] > 0) {
      newMetrics[oldStatus] -= 1;
    }
    if (newMetrics[newStatus] !== undefined) {
      newMetrics[newStatus] += 1;
    }

    transaction.update(leadRef, {
      ...updates,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(campaignRef, {
      metrics: newMetrics,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return true;
}
