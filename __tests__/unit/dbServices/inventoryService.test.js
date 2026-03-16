/**
 * Unit Tests for inventoryService
 * Tests inventory movement tracking and reconciliation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  recordInventoryMovement,
  getInventoryHistory,
  getInventoryBalance,
  reconcileInventory,
  getInventoryMovementsBySite
} from '@/lib/dbServices/inventoryService.js';

describe('inventoryService', () => {
  let mockDb;
  let mockInventoryRef;
  let mockVariantsRef;
  let mockVariantRef;

  beforeEach(() => {
    mockDb = global.createMockDb();
    mockInventoryRef = global.createMockCollectionRef('inventory');
    mockVariantsRef = global.createMockCollectionRef('variants');
    mockVariantRef = global.createMockDocRef('variants/variant123');
  });

  describe('recordInventoryMovement', () => {
    it('should record sale movement successfully', async () => {
      const movementData = {
        variantId: 'variant123',
        listingId: 'listing123',
        siteId: 'site123',
        type: 'sale',
        quantity: -2,
        reason: 'Customer purchase',
        performedBy: 'user123'
      };

      // Mock variant with current inventory
      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => ({
          inventory: { quantity: 10 }
        })
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockInventoryRef.add = vi.fn(async (data) => ({
        id: 'movement_123'
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'inventory') return mockInventoryRef;
        if (name === 'variants') return mockVariantsRef;
        return global.createMockCollectionRef(name);
      });

      const result = await recordInventoryMovement(mockDb, movementData);

      expect(result).toBe('movement_123');
      expect(mockInventoryRef.add).toHaveBeenCalled();
      
      const addedData = mockInventoryRef.add.mock.calls[0][0];
      expect(addedData.balanceAfter).toBe(8); // 10 + (-2)
      expect(addedData.type).toBe('sale');
    });

    it('should record restock movement successfully', async () => {
      const movementData = {
        variantId: 'variant123',
        listingId: 'listing123',
        siteId: 'site123',
        type: 'restock',
        quantity: 20,
        reason: 'Weekly restock',
        performedBy: 'user123'
      };

      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => ({
          inventory: { quantity: 5 }
        })
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockInventoryRef.add = vi.fn(async (data) => ({
        id: 'movement_456'
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'inventory') return mockInventoryRef;
        if (name === 'variants') return mockVariantsRef;
        return global.createMockCollectionRef(name);
      });

      const result = await recordInventoryMovement(mockDb, movementData);

      expect(result).toBe('movement_456');
      
      const addedData = mockInventoryRef.add.mock.calls[0][0];
      expect(addedData.balanceAfter).toBe(25); // 5 + 20
    });

    it('should throw error if required fields are missing', async () => {
      const movementData = {
        type: 'sale',
        quantity: -2
      };

      await expect(recordInventoryMovement(mockDb, movementData)).rejects.toThrow('variantId, listingId, and siteId are required fields');
    });

    it('should throw error for invalid movement type', async () => {
      const movementData = {
        variantId: 'variant123',
        listingId: 'listing123',
        siteId: 'site123',
        type: 'invalid_type',
        quantity: 5
      };

      await expect(recordInventoryMovement(mockDb, movementData)).rejects.toThrow('Invalid type');
    });

    it('should throw error if variant not found', async () => {
      const movementData = {
        variantId: 'nonexistent',
        listingId: 'listing123',
        siteId: 'site123',
        type: 'sale',
        quantity: -2
      };

      mockVariantRef.get = vi.fn(async () => ({
        exists: false
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return global.createMockCollectionRef(name);
      });

      await expect(recordInventoryMovement(mockDb, movementData)).rejects.toThrow('Variant nonexistent not found');
    });

    it('should throw error for insufficient inventory', async () => {
      const movementData = {
        variantId: 'variant123',
        listingId: 'listing123',
        siteId: 'site123',
        type: 'sale',
        quantity: -20,
        performedBy: 'user123'
      };

      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => ({
          inventory: { quantity: 5 }
        })
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return global.createMockCollectionRef(name);
      });

      await expect(recordInventoryMovement(mockDb, movementData)).rejects.toThrow('Insufficient inventory');
    });
  });

  describe('getInventoryHistory', () => {
    it('should fetch inventory history for a variant', async () => {
      const mockMovements = [
        { type: 'restock', quantity: 20, balanceAfter: 20 },
        { type: 'sale', quantity: -2, balanceAfter: 18 },
        { type: 'sale', quantity: -1, balanceAfter: 17 }
      ];

      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: mockMovements.map((movement, index) => ({
          id: `movement${index + 1}`,
          data: () => movement
        }))
      }));

      mockDb.collection = vi.fn(() => mockInventoryRef);

      const result = await getInventoryHistory(mockDb, 'variant123');

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe('restock');
      expect(mockInventoryRef.where).toHaveBeenCalledWith('variantId', '==', 'variant123');
    });

    it('should apply limit option', async () => {
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.limit = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: []
      }));

      mockDb.collection = vi.fn(() => mockInventoryRef);

      await getInventoryHistory(mockDb, 'variant123', { limit: 10 });

      expect(mockInventoryRef.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getInventoryBalance', () => {
    it('should calculate inventory balance correctly', async () => {
      const mockVariantData = {
        inventory: {
          quantity: 15,
          reserved: 2,
          lowStockThreshold: 5
        }
      };

      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => mockVariantData
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      // Mock recent movements
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.limit = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: [
          { id: 'mov1', data: () => ({ type: 'restock', quantity: 20 }) },
          { id: 'mov2', data: () => ({ type: 'sale', quantity: -5 }) }
        ]
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        if (name === 'inventory') return mockInventoryRef;
        return global.createMockCollectionRef(name);
      });

      const result = await getInventoryBalance(mockDb, 'variant123');

      expect(result.variantId).toBe('variant123');
      expect(result.currentQuantity).toBe(15);
      expect(result.reserved).toBe(2);
      expect(result.available).toBe(13); // 15 - 2
      expect(result.isLowStock).toBe(false); // 13 > 5
      expect(result.recentMovements).toHaveLength(2);
    });

    it('should detect low stock condition', async () => {
      const mockVariantData = {
        inventory: {
          quantity: 4,
          reserved: 0,
          lowStockThreshold: 5
        }
      };

      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => mockVariantData
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.limit = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({ docs: [] }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        if (name === 'inventory') return mockInventoryRef;
        return global.createMockCollectionRef(name);
      });

      const result = await getInventoryBalance(mockDb, 'variant123');

      expect(result.isLowStock).toBe(true);
    });

    it('should throw error if variant not found', async () => {
      mockVariantRef.get = vi.fn(async () => ({
        exists: false
      }));

      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return global.createMockCollectionRef(name);
      });

      await expect(getInventoryBalance(mockDb, 'nonexistent')).rejects.toThrow('Variant nonexistent not found');
    });
  });

  describe('reconcileInventory', () => {
    it('should reconcile inventory with no discrepancies', async () => {
      const mockVariants = [
        { 
          id: 'var1',
          name: 'Red / Large',
          sku: 'RED_L',
          inventory: { quantity: 10 }
        }
      ];

      // Mock variants query
      mockVariantsRef.where = vi.fn(() => mockVariantsRef);
      mockVariantsRef.get = vi.fn(async () => ({
        docs: mockVariants.map(v => ({
          id: v.id,
          data: () => v
        }))
      }));

      // Mock inventory movements query
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: [
          { data: () => ({ quantity: 20 }) },
          { data: () => ({ quantity: -10 }) }
        ],
        size: 2
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        if (name === 'inventory') return mockInventoryRef;
        return global.createMockCollectionRef(name);
      });

      const result = await reconcileInventory(mockDb, 'site123');

      expect(result.status).toBe('clean');
      expect(result.discrepanciesFound).toBe(0);
      expect(result.totalVariants).toBe(1);
    });

    it('should detect inventory discrepancies', async () => {
      const mockVariants = [
        { 
          id: 'var1',
          name: 'Red / Large',
          sku: 'RED_L',
          inventory: { quantity: 15 } // Recorded: 15
        }
      ];

      mockVariantsRef.where = vi.fn(() => mockVariantsRef);
      mockVariantsRef.get = vi.fn(async () => ({
        docs: mockVariants.map(v => ({
          id: v.id,
          data: () => v
        }))
      }));

      // Mock movements that calculate to 10, not 15
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: [
          { data: () => ({ quantity: 20 }) },
          { data: () => ({ quantity: -10 }) }
        ],
        size: 2
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        if (name === 'inventory') return mockInventoryRef;
        return global.createMockCollectionRef(name);
      });

      const result = await reconcileInventory(mockDb, 'site123');

      expect(result.status).toBe('discrepancies_found');
      expect(result.discrepanciesFound).toBe(1);
      expect(result.discrepancies[0].recordedQuantity).toBe(15);
      expect(result.discrepancies[0].calculatedBalance).toBe(10);
      expect(result.discrepancies[0].difference).toBe(5);
    });
  });

  describe('getInventoryMovementsBySite', () => {
    it('should fetch movements for a site', async () => {
      const mockMovements = [
        { type: 'sale', siteId: 'site123' },
        { type: 'restock', siteId: 'site123' }
      ];

      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({
        docs: mockMovements.map((mov, index) => ({
          id: `mov${index + 1}`,
          data: () => mov
        }))
      }));

      mockDb.collection = vi.fn(() => mockInventoryRef);

      const result = await getInventoryMovementsBySite(mockDb, 'site123');

      expect(result).toHaveLength(2);
      expect(mockInventoryRef.where).toHaveBeenCalledWith('siteId', '==', 'site123');
    });

    it('should filter by movement type', async () => {
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({ docs: [] }));

      mockDb.collection = vi.fn(() => mockInventoryRef);

      await getInventoryMovementsBySite(mockDb, 'site123', { type: 'sale' });

      expect(mockInventoryRef.where).toHaveBeenCalledWith('type', '==', 'sale');
    });

    it('should apply limit option', async () => {
      mockInventoryRef.where = vi.fn(() => mockInventoryRef);
      mockInventoryRef.orderBy = vi.fn(() => mockInventoryRef);
      mockInventoryRef.limit = vi.fn(() => mockInventoryRef);
      mockInventoryRef.get = vi.fn(async () => ({ docs: [] }));

      mockDb.collection = vi.fn(() => mockInventoryRef);

      await getInventoryMovementsBySite(mockDb, 'site123', { limit: 50 });

      expect(mockInventoryRef.limit).toHaveBeenCalledWith(50);
    });
  });
});
