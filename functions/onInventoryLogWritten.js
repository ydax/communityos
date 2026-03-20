/**
 * onInventoryLogWritten — Inventory Ledger Aggregation Cloud Function
 *
 * This is the heart of the Inventory Ledger system. It fires on every new
 * document written to the `inventory/{docId}` collection and uses a
 * Firestore Transaction to safely re-aggregate the `currentStock` cache
 * on the parent `variants/{variantId}` document.
 *
 * WHY TRANSACTIONS?
 *   Two concurrent sales could both read `currentStock: 15`, each subtract 1,
 *   and both write `14` — losing a sale. Transactions use optimistic locking
 *   to retry if the underlying data changed, guaranteeing correctness.
 *
 * WHY AGGREGATE (not increment)?
 *   `FieldValue.increment` is fast but doesn't self-heal. If any write
 *   was missed or duplicated, the cache drifts forever. By summing ALL
 *   `quantityDelta` values for a variant on every trigger, the cache
 *   is always the mathematical truth of the ledger.
 *
 * PERFORMANCE NOTE:
 *   For high-volume variants (hundreds of inventory logs), this full-scan
 *   approach may become expensive. When that happens, introduce a
 *   "checkpoint" document that stores { lastAggregatedTimestamp, runningTotal }
 *   and only sum logs after that checkpoint. For now (< 100 logs/variant),
 *   full scan is correct and simple.
 *
 * @module functions/onInventoryLogWritten
 */

const { getFirestore } = require('firebase-admin/firestore');

/**
 * Core aggregation logic — extracted for testability.
 *
 * Given the data from a newly-written inventory document, this function:
 *   1. Opens a Firestore Transaction
 *   2. Reads the parent variant document
 *   3. Queries ALL inventory logs for that variant
 *   4. Sums `quantityDelta` to compute the true stock
 *   5. Writes the result to `variants/{variantId}.currentStock`
 *
 * @param {Object} inventoryData - The data from the new inventory document
 * @param {string} inventoryData.variantId - The parent variant ID
 * @param {string} inventoryData.listingId - The parent listing ID
 * @param {string} inventoryData.tenantId - The tenant who owns this data
 * @param {number} inventoryData.quantityDelta - The stock change (+/-)
 * @param {string} inventoryData.reason - Why the change happened
 * @param {Object} [db] - Optional Firestore instance (for dependency injection in tests)
 * @returns {Promise<{ variantId: string, previousStock: number, newStock: number }>}
 */
async function aggregateVariantStock(inventoryData, db = null) {
  const firestore = db || getFirestore();
  const { variantId } = inventoryData;

  if (!variantId) {
    console.error('[onInventoryLogWritten] Missing variantId — skipping aggregation');
    return null;
  }

  const variantRef = firestore.collection('variants').doc(variantId);

  const result = await firestore.runTransaction(async (transaction) => {
    // 1. Read the current variant (required for transaction lock)
    const variantSnap = await transaction.get(variantRef);

    if (!variantSnap.exists) {
      console.warn(`[onInventoryLogWritten] Variant ${variantId} not found — orphaned inventory log`);
      return null;
    }

    const previousStock = variantSnap.data().currentStock ?? 0;

    // 2. Query ALL inventory logs for this variant
    const inventoryQuery = firestore
      .collection('inventory')
      .where('variantId', '==', variantId);

    const inventorySnap = await transaction.get(inventoryQuery);

    // 3. Sum every quantityDelta to compute the true stock
    let computedStock = 0;
    inventorySnap.forEach((doc) => {
      const delta = doc.data().quantityDelta;
      if (typeof delta === 'number') {
        computedStock += delta;
      }
    });

    // 4. Write the aggregated value back to the variant
    transaction.update(variantRef, {
      currentStock: computedStock,
      lastStockUpdate: Date.now(),
    });

    console.log(
      `[onInventoryLogWritten] ✅ Variant ${variantId}: ${previousStock} → ${computedStock} ` +
      `(delta: ${inventoryData.quantityDelta}, reason: ${inventoryData.reason}, ` +
      `logs: ${inventorySnap.size})`
    );

    return {
      variantId,
      previousStock,
      newStock: computedStock,
    };
  });

  return result;
}

module.exports = { aggregateVariantStock };
