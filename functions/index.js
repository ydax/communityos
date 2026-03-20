/**
 * Cloud Functions Entry Point
 *
 * Exports all Firebase Cloud Functions for the CommunityOS platform.
 * Currently houses the inventory ledger aggregation trigger.
 *
 * Architecture Notes:
 *   - Uses Firebase Functions v2 (2nd gen) for better cold-start performance
 *   - Each function is in its own module for single-responsibility
 *   - Admin SDK is initialized once here and shared across modules
 *
 * @module functions/index
 */

const { initializeApp } = require('firebase-admin/app');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { aggregateVariantStock } = require('./onInventoryLogWritten');

// Initialize Firebase Admin SDK (singleton — safe to call multiple times)
initializeApp();

/**
 * onInventoryLogWritten
 *
 * Firestore Trigger: Fires on every NEW document in `inventory/{docId}`.
 *
 * When an inventory log is appended (sale, restock, shrinkage, initial_stock),
 * this function re-aggregates the total stock for the affected variant
 * using a Firestore Transaction to prevent race conditions.
 *
 * The append-only inventory collection is the ledger of truth.
 * The `currentStock` field on variants is merely a cached aggregate.
 *
 * @see onInventoryLogWritten.js for the core aggregation logic
 */
exports.onInventoryLogWritten = onDocumentCreated(
  {
    document: 'inventory/{docId}',
    // Region should match your Firestore location
    region: 'us-central1',
  },
  async (event) => {
    const inventoryData = event.data?.data();

    if (!inventoryData) {
      console.error('[onInventoryLogWritten] No data in event — skipping');
      return;
    }

    try {
      const result = await aggregateVariantStock(inventoryData);

      if (result) {
        console.log(
          `[onInventoryLogWritten] Stock updated for variant ${result.variantId}: ` +
          `${result.previousStock} → ${result.newStock}`
        );
      }
    } catch (error) {
      console.error('[onInventoryLogWritten] Aggregation failed:', {
        variantId: inventoryData.variantId,
        error: error.message,
        stack: error.stack,
      });
      // Don't re-throw — Cloud Functions will retry on failure,
      // but the aggregation is idempotent so retries are safe
    }
  }
);
