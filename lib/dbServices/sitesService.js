/**
 * Sites Service - Firestore CRUD operations for sites collection
 * Follows dependency injection pattern for testability
 */

/**
 * Fetch a site by custom domain
 * @param {Object} db - Firestore instance (injected for testability)
 * @param {string} domain - Custom domain (e.g., "joesfencing.com")
 * @returns {Promise<Object|null>} Site document or null if not found
 */
export async function getSiteByDomain(db, domain) {
  try {
    const sitesRef = db.collection("sites");
    // Query only by domain to avoid composite index requirement
    // Filter by status in application code instead
    const snapshot = await sitesRef
      .where("domain", "==", domain)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`[getSiteByDomain] No site found for domain: ${domain}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const siteData = { id: doc.id, ...doc.data() };

    // Note: we return the site regardless of status — routing decisions
    // (e.g. showing a maintenance page) are handled at the render layer.
    return siteData;
  } catch (error) {
    console.error("[getSiteByDomain] Error fetching site:", {
      domain,
      error: error.message,
    });
    throw new Error("Failed to fetch site by domain");
  }
}

/**
 * Fetch a site by custom domain (TLD)
 * Used when a request arrives at a non-centraltexas.com domain (e.g., davidsplumbing.com)
 * @param {Object} db - Firestore instance (injected for testability)
 * @param {string} customDomain - Custom TLD (e.g., "davidsplumbing.com")
 * @returns {Promise<Object|null>} Site document or null if not found
 */
export async function getSiteByCustomDomain(db, customDomain) {
  try {
    const sitesRef = db.collection("sites");
    const snapshot = await sitesRef
      .where("customDomain", "==", customDomain)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(
        `[getSiteByCustomDomain] No site found for customDomain: ${customDomain}`,
      );
      return null;
    }

    const doc = snapshot.docs[0];
    const siteData = { id: doc.id, ...doc.data() };

    // Note: we return the site regardless of status — routing decisions
    // (e.g. showing a maintenance page) are handled at the render layer.
    return siteData;
  } catch (error) {
    console.error("[getSiteByCustomDomain] Error fetching site:", {
      customDomain,
      error: error.message,
    });
    throw new Error("Failed to fetch site by custom domain");
  }
}

/**
 * Fetch a site by ID
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @returns {Promise<Object|null>} Site document or null if not found
 */
export async function getSiteById(db, siteId) {
  try {
    const docRef = db.collection("sites").doc(siteId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`[getSiteById] No site found with ID: ${siteId}`);
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[getSiteById] Error fetching site:", {
      siteId,
      error: error.message,
    });
    throw new Error("Failed to fetch site by ID");
  }
}

/**
 * Create a new site
 * @param {Object} db - Firestore instance
 * @param {Object} siteData - Site configuration
 * @param {string} siteData.domain - Custom domain
 * @param {string} siteData.ownerId - Owner user ID
 * @param {string} siteData.businessName - Business name
 * @param {string} siteData.theme - Theme identifier
 * @param {Array} siteData.sections - Site sections configuration
 * @returns {Promise<string>} New site document ID
 */
export async function createSite(db, siteData) {
  // Validate required fields early (fail fast)
  if (!siteData.domain || !siteData.ownerId) {
    throw new Error("Domain and ownerId are required fields");
  }

  try {
    // Check if domain is already taken
    const existingSite = await getSiteByDomain(db, siteData.domain);
    if (existingSite) {
      throw new Error(`Domain ${siteData.domain} is already in use`);
    }

    const sitesRef = db.collection("sites");
    const docRef = await sitesRef.add({
      domain: siteData.domain,
      ownerId: siteData.ownerId,
      businessName: siteData.businessName || "",
      theme: siteData.theme || "the-trade",
      sections: siteData.sections || [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[createSite] Site created successfully: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[createSite] Error creating site:", {
      siteData,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Update an existing site
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSite(db, siteId, updates) {
  try {
    const docRef = db.collection("sites").doc(siteId);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`[updateSite] Site updated successfully: ${siteId}`);
  } catch (error) {
    console.error("[updateSite] Error updating site:", {
      siteId,
      error: error.message,
    });
    throw new Error("Failed to update site");
  }
}

/**
 * Delete a site (soft delete by setting status to 'deleted')
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @returns {Promise<void>}
 */
export async function deleteSite(db, siteId) {
  try {
    const docRef = db.collection("sites").doc(siteId);
    await docRef.update({
      status: "deleted",
      deletedAt: new Date(),
    });

    console.log(`[deleteSite] Site soft-deleted successfully: ${siteId}`);
  } catch (error) {
    console.error("[deleteSite] Error deleting site:", {
      siteId,
      error: error.message,
    });
    throw new Error("Failed to delete site");
  }
}

/**
 * List all sites for a specific owner
 * @param {Object} db - Firestore instance
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of site documents
 */
export async function listSitesByOwner(db, ownerId) {
  try {
    const sitesRef = db.collection("sites");
    const snapshot = await sitesRef
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[listSitesByOwner] Error listing sites:", {
      ownerId,
      error: error.message,
    });
    throw new Error("Failed to list sites by owner");
  }
}
