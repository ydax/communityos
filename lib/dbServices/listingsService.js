/**
 * Listings Service - Firestore CRUD operations for listings and variants
 * Supports both Services (hourly rate) and Goods (with variants/inventory)
 */

/**
 * Create a new listing (Service or Good)
 * @param {Object} db - Firestore instance
 * @param {Object} listingData - Listing configuration
 * @param {string} listingData.siteId - Associated site ID
 * @param {string} listingData.title - Listing title
 * @param {string} listingData.description - Listing description
 * @param {string} listingData.type - "service" or "good"
 * @param {Object} listingData.pricing - Pricing configuration
 * @returns {Promise<string>} New listing document ID
 */
export async function createListing(db, listingData) {
  // Validate required fields
  if (!listingData.siteId || !listingData.title || !listingData.type) {
    throw new Error("siteId, title, and type are required fields");
  }

  if (!["service", "good"].includes(listingData.type)) {
    throw new Error('type must be either "service" or "good"');
  }

  try {
    const listingsRef = db.collection("listings");
    const docRef = await listingsRef.add({
      siteId: listingData.siteId,
      title: listingData.title,
      description: listingData.description || "",
      type: listingData.type,
      pricing: listingData.pricing || {},
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[createListing] Listing created successfully: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[createListing] Error creating listing:", {
      listingData,
      error: error.message,
    });
    throw new Error("Failed to create listing");
  }
}

/**
 * Fetch a listing by ID
 * @param {Object} db - Firestore instance
 * @param {string} listingId - Listing document ID
 * @returns {Promise<Object|null>} Listing document or null if not found
 */
export async function getListingById(db, listingId) {
  try {
    const docRef = db.collection("listings").doc(listingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`[getListingById] No listing found with ID: ${listingId}`);
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[getListingById] Error fetching listing:", {
      listingId,
      error: error.message,
    });
    throw new Error("Failed to fetch listing by ID");
  }
}

/**
 * List listings with optional filters
 * @param {Object} db - Firestore instance
 * @param {Object} filters - Optional filters
 * @param {string} filters.siteId - Filter by site ID
 * @param {string} filters.type - Filter by type (service/good)
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Object>} Object with items array and total count
 */
export async function listListings(db, filters = {}) {
  try {
    let query = db.collection("listings");

    // Apply filters
    if (filters.siteId) {
      query = query.where("siteId", "==", filters.siteId);
    }
    if (filters.type) {
      query = query.where("type", "==", filters.type);
    }
    if (filters.status) {
      query = query.where("status", "==", filters.status);
    }

    // Order by creation date
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      items,
      total: items.length,
    };
  } catch (error) {
    console.error("[listListings] Error listing listings:", {
      filters,
      error: error.message,
    });
    throw new Error("Failed to list listings");
  }
}

/**
 * List all listings for a site
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @returns {Promise<Array>} Array of listing documents
 */
export async function listListingsBySite(db, siteId) {
  try {
    const result = await listListings(db, { siteId, status: "active" });
    return result.items;
  } catch (error) {
    console.error("[listListingsBySite] Error listing listings:", {
      siteId,
      error: error.message,
    });
    throw new Error("Failed to list listings by site");
  }
}

/**
 * Update a listing
 * @param {Object} db - Firestore instance
 * @param {string} listingId - Listing document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateListing(db, listingId, updates) {
  try {
    const docRef = db.collection("listings").doc(listingId);
    await docRef.update({
      ...updates,
      updatedAt: new Date(),
    });

    console.log(`[updateListing] Listing updated successfully: ${listingId}`);
  } catch (error) {
    console.error("[updateListing] Error updating listing:", {
      listingId,
      error: error.message,
    });
    throw new Error("Failed to update listing");
  }
}

/**
 * Delete a listing (soft delete)
 * @param {Object} db - Firestore instance
 * @param {string} listingId - Listing document ID
 * @returns {Promise<void>}
 */
export async function deleteListing(db, listingId) {
  try {
    const docRef = db.collection("listings").doc(listingId);
    await docRef.update({
      status: "deleted",
      deletedAt: new Date(),
    });

    console.log(
      `[deleteListing] Listing soft-deleted successfully: ${listingId}`,
    );
  } catch (error) {
    console.error("[deleteListing] Error deleting listing:", {
      listingId,
      error: error.message,
    });
    throw new Error("Failed to delete listing");
  }
}

/**
 * Create a variant for a listing (for Goods with SKUs)
 * @param {Object} db - Firestore instance
 * @param {Object} variantData - Variant configuration
 * @param {string} variantData.listingId - Parent listing ID
 * @param {string} variantData.name - Variant name (e.g., "Red T-Shirt (Large)")
 * @param {string} variantData.sku - SKU identifier
 * @param {number} variantData.price - Variant price
 * @param {number} variantData.inventory - Inventory count
 * @returns {Promise<string>} New variant document ID
 */
export async function createVariant(db, variantData) {
  // Validate required fields
  if (!variantData.listingId || !variantData.sku) {
    throw new Error("listingId and sku are required fields");
  }

  try {
    const variantsRef = db.collection("variants");
    const docRef = await variantsRef.add({
      listingId: variantData.listingId,
      name: variantData.name || "",
      sku: variantData.sku,
      price: variantData.price || 0,
      inventory: variantData.inventory || 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`[createVariant] Variant created successfully: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("[createVariant] Error creating variant:", {
      variantData,
      error: error.message,
    });
    throw new Error("Failed to create variant");
  }
}

/**
 * List all variants for a listing
 * @param {Object} db - Firestore instance
 * @param {string} listingId - Listing document ID
 * @returns {Promise<Array>} Array of variant documents
 */
export async function listVariantsByListing(db, listingId) {
  try {
    const variantsRef = db.collection("variants");
    const snapshot = await variantsRef
      .where("listingId", "==", listingId)
      .where("status", "==", "active")
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[listVariantsByListing] Error listing variants:", {
      listingId,
      error: error.message,
    });
    throw new Error("Failed to list variants by listing");
  }
}

/**
 * Update variant inventory count
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @param {number} newQuantity - New inventory quantity (not a change, absolute value)
 * @returns {Promise<void>}
 */
export async function updateVariantInventory(db, variantId, newQuantity) {
  try {
    const docRef = db.collection("variants").doc(variantId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error(`Variant ${variantId} not found`);
    }

    if (newQuantity < 0) {
      throw new Error("Inventory cannot be negative");
    }

    const currentInventory = doc.data().inventory?.quantity || 0;

    await docRef.update({
      "inventory.quantity": newQuantity,
      updatedAt: new Date(),
    });

    console.log(
      `[updateVariantInventory] Inventory updated: ${variantId} (${currentInventory} → ${newQuantity})`,
    );
  } catch (error) {
    console.error("[updateVariantInventory] Error updating inventory:", {
      variantId,
      newQuantity,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Fetch a variant by ID
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @returns {Promise<Object|null>} Variant document or null if not found
 */
export async function getVariantById(db, variantId) {
  try {
    const docRef = db.collection("variants").doc(variantId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log(`[getVariantById] No variant found with ID: ${variantId}`);
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("[getVariantById] Error fetching variant:", {
      variantId,
      error: error.message,
    });
    throw new Error("Failed to fetch variant by ID");
  }
}

/**
 * Update a variant
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateVariant(db, variantId, updates) {
  try {
    const docRef = db.collection("variants").doc(variantId);

    // Ensure variant exists before updating
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Variant ${variantId} not found`);
    }

    await docRef.update({
      ...updates,
      "metadata.updatedAt": new Date(),
    });

    console.log(`[updateVariant] Variant updated successfully: ${variantId}`);
  } catch (error) {
    console.error("[updateVariant] Error updating variant:", {
      variantId,
      error: error.message,
    });
    throw error; // Re-throw the original error instead of wrapping
  }
}

/**
 * Delete a variant (soft delete)
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @returns {Promise<void>}
 */
export async function deleteVariant(db, variantId) {
  try {
    const docRef = db.collection("variants").doc(variantId);

    // Ensure variant exists before deleting
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Variant ${variantId} not found`);
    }

    await docRef.update({
      status: "discontinued",
      "metadata.updatedAt": new Date(),
    });

    console.log(
      `[deleteVariant] Variant soft-deleted successfully: ${variantId}`,
    );
  } catch (error) {
    console.error("[deleteVariant] Error deleting variant:", {
      variantId,
      error: error.message,
    });
    throw new Error("Failed to delete variant");
  }
}

/**
 * Update listing's totalAvailable inventory count (recalculate from variants)
 * @param {Object} db - Firestore instance
 * @param {string} listingId - Listing document ID
 * @returns {Promise<number>} Updated total available inventory
 */
export async function updateListingInventoryCount(db, listingId) {
  try {
    // Get listing to ensure it's a "good" type
    const listingRef = db.collection("listings").doc(listingId);
    const listingDoc = await listingRef.get();

    if (!listingDoc.exists) {
      throw new Error(`Listing ${listingId} not found`);
    }

    const listingData = listingDoc.data();

    // Only update inventory for goods (not services)
    if (listingData.type !== "good") {
      console.log(
        `[updateListingInventoryCount] Skipping inventory update for service listing: ${listingId}`,
      );
      return 0;
    }

    // Get all active variants for this listing
    const variantsRef = db.collection("variants");
    const snapshot = await variantsRef
      .where("listingId", "==", listingId)
      .where("status", "==", "active")
      .get();

    // Sum up inventory from all variants
    let totalAvailable = 0;
    snapshot.docs.forEach((doc) => {
      const variant = doc.data();
      const quantity = variant.inventory?.quantity || 0;
      totalAvailable += quantity;
    });

    // Update listing's totalAvailable
    await listingRef.update({
      "inventory.totalAvailable": totalAvailable,
      updatedAt: new Date(),
    });

    console.log(
      `[updateListingInventoryCount] Updated listing ${listingId} totalAvailable: ${totalAvailable}`,
    );

    return totalAvailable;
  } catch (error) {
    console.error(
      "[updateListingInventoryCount] Error updating inventory count:",
      { listingId, error: error.message },
    );
    throw new Error("Failed to update listing inventory count");
  }
}

/**
 * List all active listings across all sites (for marketplace)
 * @param {Object} db - Firestore instance
 * @param {Object} filters - Optional filters
 * @param {string} filters.type - Filter by type (service/good)
 * @param {string} filters.category - Filter by category
 * @param {string} filters.searchTerm - Search term for title/description
 * @param {number} filters.limit - Maximum number of results (default 50)
 * @returns {Promise<Array>} Array of listings enriched with site metadata
 */
export async function listAllActiveListings(db, filters = {}) {
  try {
    let query = db.collection("listings");

    // Only active listings
    query = query.where("status", "==", "active");

    // Apply type filter
    if (filters.type) {
      query = query.where("type", "==", filters.type);
    }

    // Apply category filter
    if (filters.category) {
      query = query.where("category", "==", filters.category);
    }

    // Order by creation date (most recent first)
    query = query.orderBy("createdAt", "desc");

    // Apply limit
    const limit = filters.limit || 50;
    query = query.limit(limit);

    const snapshot = await query.get();
    const listings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Enrich listings with site metadata
    const enrichedListings = [];
    
    for (const listing of listings) {
      try {
        // Fetch associated site
        const siteDoc = await db.collection("sites").doc(listing.siteId).get();
        
        if (siteDoc.exists) {
          const siteData = siteDoc.data();
          
          // Apply search filter if provided (case-insensitive)
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            const titleMatch = listing.title?.toLowerCase().includes(searchLower);
            const descMatch = listing.description?.toLowerCase().includes(searchLower);
            const businessMatch = siteData.businessName?.toLowerCase().includes(searchLower);
            
            if (!titleMatch && !descMatch && !businessMatch) {
              continue; // Skip this listing if search doesn't match
            }
          }
          
          enrichedListings.push({
            ...listing,
            siteName: siteData.businessName || "Unknown Business",
            siteDomain: siteData.domain || "",
            siteLocation: siteData.location || "",
          });
        } else {
          console.warn(`[listAllActiveListings] Site not found for listing: ${listing.id}`);
        }
      } catch (error) {
        console.error(`[listAllActiveListings] Error enriching listing ${listing.id}:`, error.message);
      }
    }

    console.log(`[listAllActiveListings] Found ${enrichedListings.length} listings`);
    return enrichedListings;
  } catch (error) {
    console.error("[listAllActiveListings] Error listing marketplace listings:", {
      filters,
      error: error.message,
    });
    throw new Error("Failed to list marketplace listings");
  }
}

