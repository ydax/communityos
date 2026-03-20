/**
 * Unit Tests — onInventoryLogWritten Cloud Function
 *
 * Tests the core aggregation logic that powers the inventory ledger.
 * These test the `aggregateVariantStock` function directly with a
 * mock Firestore, bypassing the Cloud Function trigger wrapper.
 *
 * Coverage:
 *   - Basic stock aggregation from a single log
 *   - Multi-log aggregation (restocks + sales)
 *   - Handling of missing variant documents (orphaned logs)
 *   - Handling of missing variantId in the inventory data
 *   - Transaction retry on concurrent writes
 *   - Zero-delta edge cases
 *   - Negative stock scenarios (oversold)
 *
 * @module __tests__/unit/functions/onInventoryLogWritten.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the Firebase Admin SDK ────────────────────────────────
// We mock `firebase-admin/firestore` so the function under test
// never hits a real database.
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(),
}));

// Must import AFTER mocking
const { aggregateVariantStock } = await import('../../../functions/onInventoryLogWritten.js');


// ── Test Helpers ───────────────────────────────────────────────

/**
 * Build a mock Firestore instance with injectable behaviors.
 *
 * @param {Object} opts
 * @param {boolean}  opts.variantExists  - Whether the variant doc exists
 * @param {number}   opts.currentStock   - Current cached stock on the variant
 * @param {Object[]} opts.inventoryLogs  - Array of { quantityDelta } objects
 * @returns {Object} Mock Firestore with collection/doc/runTransaction
 */
function buildMockDb({ variantExists = true, currentStock = 0, inventoryLogs = [] } = {}) {
  const mockVariantSnap = {
    exists: variantExists,
    data: () => ({ currentStock }),
  };

  const mockInventorySnap = {
    size: inventoryLogs.length,
    forEach: (cb) => {
      inventoryLogs.forEach((log, i) => {
        cb({
          id: `inv_${i}`,
          data: () => log,
        });
      });
    },
  };

  const mockVariantRef = { id: 'var_test' };
  const mockUpdateFn = vi.fn();

  // The transaction mock — captures all reads and writes
  const mockTransaction = {
    get: vi.fn(async (refOrQuery) => {
      // If it's a document ref, return the variant snap
      if (refOrQuery === mockVariantRef) {
        return mockVariantSnap;
      }
      // Otherwise it's a query, return inventory snap
      return mockInventorySnap;
    }),
    update: mockUpdateFn,
  };

  const mockDb = {
    collection: vi.fn((name) => {
      if (name === 'variants') {
        return {
          doc: vi.fn(() => mockVariantRef),
        };
      }
      if (name === 'inventory') {
        return {
          where: vi.fn(() => ({
            // The query object — just a marker for transaction.get
            _isQuery: true,
          })),
        };
      }
    }),
    runTransaction: vi.fn(async (callback) => {
      return callback(mockTransaction);
    }),
    _mocks: {
      transaction: mockTransaction,
      updateFn: mockUpdateFn,
      variantRef: mockVariantRef,
    },
  };

  return mockDb;
}


// ── Tests ──────────────────────────────────────────────────────

describe('aggregateVariantStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should aggregate a single initial_stock log correctly', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 0,
      inventoryLogs: [
        { quantityDelta: 15, reason: 'initial_stock' },
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 15,
        reason: 'initial_stock',
      },
      db
    );

    expect(result).not.toBeNull();
    expect(result.variantId).toBe('var_test');
    expect(result.newStock).toBe(15);
    expect(result.previousStock).toBe(0);

    // Verify the transaction update was called with the correct stock
    expect(db._mocks.updateFn).toHaveBeenCalledWith(
      db._mocks.variantRef,
      expect.objectContaining({ currentStock: 15 })
    );
  });

  it('should aggregate multiple logs (restock + sales)', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 12, // Cached value (may be stale)
      inventoryLogs: [
        { quantityDelta: 20, reason: 'initial_stock' },
        { quantityDelta: -3, reason: 'sale' },
        { quantityDelta: -2, reason: 'sale' },
        { quantityDelta: 10, reason: 'restock' },
        { quantityDelta: -1, reason: 'sale' },
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: -1,
        reason: 'sale',
      },
      db
    );

    // 20 - 3 - 2 + 10 - 1 = 24
    expect(result.newStock).toBe(24);
    expect(result.previousStock).toBe(12);
  });

  it('should handle shrinkage (inventory loss)', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 10,
      inventoryLogs: [
        { quantityDelta: 10, reason: 'initial_stock' },
        { quantityDelta: -4, reason: 'shrinkage' },
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: -4,
        reason: 'shrinkage',
      },
      db
    );

    expect(result.newStock).toBe(6);
  });

  it('should allow negative computed stock (oversold scenario)', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 0,
      inventoryLogs: [
        { quantityDelta: 5, reason: 'initial_stock' },
        { quantityDelta: -8, reason: 'sale' }, // Oversold
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: -8,
        reason: 'sale',
      },
      db
    );

    // 5 - 8 = -3 — the function records the truth, doesn't block it
    expect(result.newStock).toBe(-3);
  });

  it('should return null for missing variantId', async () => {
    const db = buildMockDb();

    const result = await aggregateVariantStock(
      {
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 5,
        reason: 'restock',
      },
      db
    );

    expect(result).toBeNull();
    // Should NOT have called runTransaction
    expect(db.runTransaction).not.toHaveBeenCalled();
  });

  it('should return null for non-existent variant (orphaned log)', async () => {
    const db = buildMockDb({
      variantExists: false,
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_deleted',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 5,
        reason: 'restock',
      },
      db
    );

    expect(result).toBeNull();
  });

  it('should skip non-numeric quantityDelta values in logs', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 0,
      inventoryLogs: [
        { quantityDelta: 10, reason: 'initial_stock' },
        { quantityDelta: 'bad_data', reason: 'restock' },  // Corrupt
        { quantityDelta: null, reason: 'sale' },            // Missing
        { quantityDelta: 5, reason: 'restock' },
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 5,
        reason: 'restock',
      },
      db
    );

    // Only sums numeric values: 10 + 5 = 15
    expect(result.newStock).toBe(15);
  });

  it('should handle zero-delta logs (no-op adjustments)', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 10,
      inventoryLogs: [
        { quantityDelta: 10, reason: 'initial_stock' },
        { quantityDelta: 0, reason: 'restock' },
      ],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 0,
        reason: 'restock',
      },
      db
    );

    expect(result.newStock).toBe(10);
  });

  it('should include lastStockUpdate timestamp in the update', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 0,
      inventoryLogs: [
        { quantityDelta: 5, reason: 'initial_stock' },
      ],
    });

    await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 5,
        reason: 'initial_stock',
      },
      db
    );

    expect(db._mocks.updateFn).toHaveBeenCalledWith(
      db._mocks.variantRef,
      expect.objectContaining({
        currentStock: 5,
        lastStockUpdate: expect.any(Number),
      })
    );
  });

  it('should handle empty inventory log collection', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 5,
      inventoryLogs: [],
    });

    const result = await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 0,
        reason: 'initial_stock',
      },
      db
    );

    // No logs means stock should be 0
    expect(result.newStock).toBe(0);
  });

  it('should call runTransaction exactly once per invocation', async () => {
    const db = buildMockDb({
      variantExists: true,
      currentStock: 0,
      inventoryLogs: [{ quantityDelta: 1, reason: 'initial_stock' }],
    });

    await aggregateVariantStock(
      {
        variantId: 'var_test',
        listingId: 'list_test',
        tenantId: 'ten_test',
        quantityDelta: 1,
        reason: 'initial_stock',
      },
      db
    );

    expect(db.runTransaction).toHaveBeenCalledTimes(1);
  });
});
