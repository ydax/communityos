/**
 * Inventory Service - Firestore CRUD operations for inventory collection
 * Manages historical inventory tracking and audit log
 * Follows dependency injection pattern for testability
 */

/**
 * Record an inventory movement (sale, restock, adjustment, etc.)
 * @param {Object} db - Firestore instance (injected for testability)
 * @param {Object} movementData - Inventory movement data
 * @param {string} movementData.variantId - Reference to variants/{variantId}
 * @param {string} movementData.listingId - Reference to listings/{listingId}
 * @param {string} movementData.siteId - Reference to sites/{siteId}
 * @param {string} movementData.type - Movement type: "sale", "restock", "adjustment", "return", "reservation", "release"
 * @param {number} movementData.quantity - Quantity changed (positive or negative)
 * @param {string|null} movementData.reason - Human-readable reason
 * @param {string|null} movementData.orderId - Reference to orders/{orderId}
 * @param {string} movementData.performedBy - User who performed action (UID or "system")
 * @param {string|null} movementData.notes - Additional notes
 * @returns {Promise<string>} New inventory movement document ID
 */
export async function recordInventoryMovement(db, movementData) {
  // Validate required fields early (fail fast)
  if (!movementData.variantId || !movementData.listingId || !movementData.siteId) {
    throw new Error('variantId, listingId, and siteId are required fields');
  }

  if (!movementData.type || !movementData.quantity) {
    throw new Error('type and quantity are required fields');
  }

  const validTypes = ['sale', 'restock', 'adjustment', 'return', 'reservation', 'release'];
  if (!validTypes.includes(movementData.type)) {
    throw new Error(`Invalid type: ${movementData.type}. Must be one of: ${validTypes.join(', ')}`);
  }

  try {
    // Get current variant inventory to calculate balance
    const variantRef = db.collection('variants').doc(movementData.variantId);
    const variantDoc = await variantRef.get();

    if (!variantDoc.exists) {
      throw new Error(`Variant ${movementData.variantId} not found`);
    }

    const currentInventory = variantDoc.data().inventory?.quantity || 0;
    const balanceAfter = currentInventory + movementData.quantity;

    // Prevent negative inventory (except for special cases like reservations)
    if (balanceAfter < 0 && movementData.type !== 'reservation') {
      throw new Error(`Insufficient inventory. Current: ${currentInventory}, Requested: ${Math.abs(movementData.quantity)}`);
    }

    // Create inventory movement record
    const inventoryRef = db.collection('inventory');
    const docRef = await inventoryRef.add({
      variantId: movementData.variantId,
      listingId: movementData.listingId,
      siteId: movementData.siteId,
      type: movementData.type,
      quantity: movementData.quantity,
      reason: movementData.reason || null,
      orderId: movementData.orderId || null,
      balanceAfter: balanceAfter,
      performedBy: movementData.performedBy || 'system',
      metadata: {
        createdAt: new Date(),
        source: movementData.source || 'api'
      },
      notes: movementData.notes || null
    });

    console.log(`[recordInventoryMovement] Movement recorded successfully: ${docRef.id}`, {
      variantId: movementData.variantId,
      type: movementData.type,
      quantity: movementData.quantity,
      balanceAfter
    });

    return docRef.id;
  } catch (error) {
    console.error('[recordInventoryMovement] Error recording movement:', {
      movementData,
      error: error.message
    });
    throw error;
  }
}

/**
 * Fetch inventory movement history for a variant
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of movements to return
 * @param {string} options.orderBy - Field to order by (default: 'metadata.createdAt')
 * @param {string} options.order - Sort order: 'asc' or 'desc' (default: 'desc')
 * @returns {Promise<Array>} Array of inventory movement documents
 */
export async function getInventoryHistory(db, variantId, options = {}) {
  try {
    const inventoryRef = db.collection('inventory');
    let query = inventoryRef.where('variantId', '==', variantId);

    // Apply ordering
    const orderBy = options.orderBy || 'metadata.createdAt';
    const order = options.order || 'desc';
    query = query.orderBy(orderBy, order);

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    const movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[getInventoryHistory] Fetched ${movements.length} movements for variant: ${variantId}`);

    return movements;
  } catch (error) {
    console.error('[getInventoryHistory] Error fetching history:', {
      variantId,
      error: error.message
    });
    throw new Error('Failed to fetch inventory history');
  }
}

/**
 * Calculate current inventory balance for a variant
 * @param {Object} db - Firestore instance
 * @param {string} variantId - Variant document ID
 * @returns {Promise<Object>} Balance information
 */
export async function getInventoryBalance(db, variantId) {
  try {
    // Get variant's current inventory from the variant document
    const variantRef = db.collection('variants').doc(variantId);
    const variantDoc = await variantRef.get();

    if (!variantDoc.exists) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const variantData = variantDoc.data();
    const currentQuantity = variantData.inventory?.quantity || 0;
    const reserved = variantData.inventory?.reserved || 0;
    const available = currentQuantity - reserved;

    // Get recent movements for context
    const recentMovements = await getInventoryHistory(db, variantId, { limit: 5 });

    const balance = {
      variantId,
      currentQuantity,
      reserved,
      available,
      lowStockThreshold: variantData.inventory?.lowStockThreshold || null,
      isLowStock: variantData.inventory?.lowStockThreshold
        ? available <= variantData.inventory.lowStockThreshold
        : false,
      recentMovements: recentMovements.slice(0, 3) // Return last 3 movements
    };

    console.log(`[getInventoryBalance] Balance for variant ${variantId}:`, {
      currentQuantity,
      reserved,
      available
    });

    return balance;
  } catch (error) {
    console.error('[getInventoryBalance] Error calculating balance:', {
      variantId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Reconcile inventory for a site (audit trail verification)
 * Compares variant inventory counts with movement history
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @returns {Promise<Object>} Reconciliation report
 */
export async function reconcileInventory(db, siteId) {
  try {
    console.log(`[reconcileInventory] Starting reconciliation for site: ${siteId}`);

    // Get all variants for the site
    const variantsRef = db.collection('variants');
    const variantsSnapshot = await variantsRef
      .where('siteId', '==', siteId)
      .where('status', '==', 'active')
      .get();

    const discrepancies = [];
    let totalVariants = 0;
    let variantsChecked = 0;

    for (const variantDoc of variantsSnapshot.docs) {
      totalVariants++;
      const variantId = variantDoc.id;
      const variantData = variantDoc.data();
      const recordedQuantity = variantData.inventory?.quantity || 0;

      // Get all movements for this variant
      const movementsRef = db.collection('inventory');
      const movementsSnapshot = await movementsRef
        .where('variantId', '==', variantId)
        .orderBy('metadata.createdAt', 'asc')
        .get();

      // Calculate balance from movement history
      let calculatedBalance = 0;
      movementsSnapshot.docs.forEach(doc => {
        const movement = doc.data();
        calculatedBalance += movement.quantity;
      });

      // Check for discrepancies
      if (calculatedBalance !== recordedQuantity) {
        discrepancies.push({
          variantId,
          variantName: variantData.name,
          sku: variantData.sku,
          recordedQuantity,
          calculatedBalance,
          difference: recordedQuantity - calculatedBalance,
          movementCount: movementsSnapshot.size
        });
      }

      variantsChecked++;
    }

    const report = {
      siteId,
      timestamp: new Date(),
      totalVariants,
      variantsChecked,
      discrepanciesFound: discrepancies.length,
      discrepancies,
      status: discrepancies.length === 0 ? 'clean' : 'discrepancies_found'
    };

    console.log(`[reconcileInventory] Reconciliation complete for site ${siteId}:`, {
      totalVariants,
      discrepanciesFound: discrepancies.length
    });

    return report;
  } catch (error) {
    console.error('[reconcileInventory] Error during reconciliation:', {
      siteId,
      error: error.message
    });
    throw new Error('Failed to reconcile inventory');
  }
}

/**
 * Get inventory movements by site (for reporting)
 * @param {Object} db - Firestore instance
 * @param {string} siteId - Site document ID
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by movement type
 * @param {number} options.limit - Maximum number of movements to return
 * @param {Date} options.startDate - Filter movements after this date
 * @param {Date} options.endDate - Filter movements before this date
 * @returns {Promise<Array>} Array of inventory movement documents
 */
export async function getInventoryMovementsBySite(db, siteId, options = {}) {
  try {
    const inventoryRef = db.collection('inventory');
    let query = inventoryRef.where('siteId', '==', siteId);

    // Apply type filter
    if (options.type) {
      query = query.where('type', '==', options.type);
    }

    // Order by creation date
    query = query.orderBy('metadata.createdAt', 'desc');

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    let movements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Apply date filters (client-side since Firestore has query limitations)
    if (options.startDate) {
      movements = movements.filter(m => m.metadata.createdAt >= options.startDate);
    }

    if (options.endDate) {
      movements = movements.filter(m => m.metadata.createdAt <= options.endDate);
    }

    console.log(`[getInventoryMovementsBySite] Fetched ${movements.length} movements for site: ${siteId}`);

    return movements;
  } catch (error) {
    console.error('[getInventoryMovementsBySite] Error fetching movements:', {
      siteId,
      error: error.message
    });
    throw new Error('Failed to fetch inventory movements by site');
  }
}
