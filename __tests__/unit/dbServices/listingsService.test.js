/**
 * Unit Tests for listingsService
 * Tests CRUD operations for listings and variants
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createListing,
  getListingById,
  listListingsBySite,
  updateListing,
  deleteListing,
  createVariant,
  listVariantsByListing,
  getVariantById,
  updateVariant,
  deleteVariant,
  updateListingInventoryCount
} from '@/lib/dbServices/listingsService.js';

describe('listingsService', () => {
  let mockDb;
  let mockCollectionRef;
  let mockDocRef;

  beforeEach(() => {
    mockDb = global.createMockDb();
    mockCollectionRef = global.createMockCollectionRef('listings');
    mockDocRef = global.createMockDocRef('listings/listing123');
  });

  describe('createListing', () => {
    it('should create service listing successfully', async () => {
      const listingData = {
        siteId: 'site123',
        title: 'Fence Repair',
        type: 'service',
        pricing: { model: 'hourly', basePrice: 75 }
      };

      mockCollectionRef.add = vi.fn(async () => ({
        id: 'listing_123'
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await createListing(mockDb, listingData);

      expect(result).toBe('listing_123');
      expect(mockCollectionRef.add).toHaveBeenCalled();
    });

    it('should create goods listing successfully', async () => {
      const listingData = {
        siteId: 'site123',
        title: 'T-Shirt',
        type: 'good',
        pricing: { model: 'variant_based', basePrice: 24.99 }
      };

      mockCollectionRef.add = vi.fn(async () => ({
        id: 'listing_456'
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await createListing(mockDb, listingData);

      expect(result).toBe('listing_456');
    });

    it('should throw error if required fields are missing', async () => {
      const listingData = {
        title: 'Incomplete Listing'
      };

      await expect(createListing(mockDb, listingData)).rejects.toThrow('siteId, title, and type are required fields');
    });

    it('should throw error for invalid type', async () => {
      const listingData = {
        siteId: 'site123',
        title: 'Invalid Listing',
        type: 'invalid_type'
      };

      await expect(createListing(mockDb, listingData)).rejects.toThrow('type must be either "service" or "good"');
    });
  });

  describe('getListingById', () => {
    it('should fetch listing by ID successfully', async () => {
      const mockListingData = {
        siteId: 'site123',
        title: 'Fence Repair',
        type: 'service'
      };

      mockDocRef.get = vi.fn(async () => ({
        exists: true,
        id: 'listing123',
        data: () => mockListingData
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getListingById(mockDb, 'listing123');

      expect(result).toEqual({ id: 'listing123', ...mockListingData });
    });

    it('should return null for non-existent listing', async () => {
      mockDocRef.get = vi.fn(async () => ({
        exists: false
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await getListingById(mockDb, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listListingsBySite', () => {
    it('should list listings for a site', async () => {
      const mockListings = [
        { title: 'Service 1', type: 'service' },
        { title: 'Product 1', type: 'good' }
      ];

      mockCollectionRef.where = vi.fn(() => mockCollectionRef);
      mockCollectionRef.orderBy = vi.fn(() => mockCollectionRef);
      mockCollectionRef.get = vi.fn(async () => ({
        docs: mockListings.map((listing, index) => ({
          id: `listing${index + 1}`,
          data: () => listing
        }))
      }));

      mockDb.collection = vi.fn(() => mockCollectionRef);

      const result = await listListingsBySite(mockDb, 'site123');

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Service 1');
      expect(mockCollectionRef.where).toHaveBeenCalledWith('siteId', '==', 'site123');
    });
  });

  describe('updateListing', () => {
    it('should update listing successfully', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      mockDocRef.update = vi.fn(async () => ({}));
      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      await updateListing(mockDb, 'listing123', updates);

      expect(mockDocRef.update).toHaveBeenCalled();
    });
  });

  describe('deleteListing', () => {
    it('should soft delete listing successfully', async () => {
      mockDocRef.update = vi.fn(async () => ({}));
      mockCollectionRef.doc = vi.fn(() => mockDocRef);
      mockDb.collection = vi.fn(() => mockCollectionRef);

      await deleteListing(mockDb, 'listing123');

      expect(mockDocRef.update).toHaveBeenCalled();
      const updateCall = mockDocRef.update.mock.calls[0][0];
      expect(updateCall.status).toBe('deleted');
    });
  });

  describe('createVariant', () => {
    it('should create variant successfully', async () => {
      const variantData = {
        listingId: 'listing123',
        sku: 'TSHIRT_RED_L',
        name: 'Red / Large',
        price: 24.99,
        inventory: 10
      };

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.add = vi.fn(async () => ({
        id: 'variant_123'
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      const result = await createVariant(mockDb, variantData);

      expect(result).toBe('variant_123');
      expect(mockVariantsRef.add).toHaveBeenCalled();
    });

    it('should throw error if required fields are missing', async () => {
      const variantData = {
        name: 'Incomplete Variant'
      };

      await expect(createVariant(mockDb, variantData)).rejects.toThrow('listingId and sku are required fields');
    });
  });

  describe('listVariantsByListing', () => {
    it('should list variants for a listing', async () => {
      const mockVariants = [
        { sku: 'RED_L', name: 'Red / Large' },
        { sku: 'BLUE_M', name: 'Blue / Medium' }
      ];

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.where = vi.fn(() => mockVariantsRef);
      mockVariantsRef.get = vi.fn(async () => ({
        docs: mockVariants.map((variant, index) => ({
          id: `variant${index + 1}`,
          data: () => variant
        }))
      }));

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      const result = await listVariantsByListing(mockDb, 'listing123');

      expect(result).toHaveLength(2);
      expect(result[0].sku).toBe('RED_L');
    });
  });

  describe('getVariantById', () => {
    it('should fetch variant by ID successfully', async () => {
      const mockVariantData = {
        listingId: 'listing123',
        sku: 'TSHIRT_RED_L',
        name: 'Red / Large'
      };

      const mockVariantRef = global.createMockDocRef('variants/variant123');
      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => mockVariantData
      }));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      const result = await getVariantById(mockDb, 'variant123');

      expect(result).toEqual({ id: 'variant123', ...mockVariantData });
    });

    it('should return null for non-existent variant', async () => {
      const mockVariantRef = global.createMockDocRef('variants/nonexistent');
      mockVariantRef.get = vi.fn(async () => ({
        exists: false
      }));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      const result = await getVariantById(mockDb, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateVariant', () => {
    it('should update variant successfully', async () => {
      const updates = {
        price: 29.99,
        'inventory.quantity': 15
      };

      const mockVariantRef = global.createMockDocRef('variants/variant123');
      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => ({ sku: 'TSHIRT_RED_L' })
      }));
      mockVariantRef.update = vi.fn(async () => ({}));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      await updateVariant(mockDb, 'variant123', updates);

      expect(mockVariantRef.update).toHaveBeenCalled();
    });

    it('should throw error if variant not found', async () => {
      const mockVariantRef = global.createMockDocRef('variants/nonexistent');
      mockVariantRef.get = vi.fn(async () => ({
        exists: false
      }));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      await expect(updateVariant(mockDb, 'nonexistent', {})).rejects.toThrow('Variant nonexistent not found');
    });
  });

  describe('deleteVariant', () => {
    it('should soft delete variant successfully', async () => {
      const mockVariantRef = global.createMockDocRef('variants/variant123');
      mockVariantRef.get = vi.fn(async () => ({
        exists: true,
        id: 'variant123',
        data: () => ({ sku: 'TSHIRT_RED_L' })
      }));
      mockVariantRef.update = vi.fn(async () => ({}));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.doc = vi.fn(() => mockVariantRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        return mockCollectionRef;
      });

      await deleteVariant(mockDb, 'variant123');

      expect(mockVariantRef.update).toHaveBeenCalled();
      const updateCall = mockVariantRef.update.mock.calls[0][0];
      expect(updateCall.status).toBe('discontinued');
    });
  });

  describe('updateListingInventoryCount', () => {
    it('should update inventory count for goods listing', async () => {
      const mockListingData = {
        type: 'good',
        title: 'T-Shirt'
      };

      mockDocRef.get = vi.fn(async () => ({
        exists: true,
        id: 'listing123',
        data: () => mockListingData
      }));
      mockDocRef.update = vi.fn(async () => ({}));

      const mockVariantsRef = global.createMockCollectionRef('variants');
      mockVariantsRef.where = vi.fn(() => mockVariantsRef);
      mockVariantsRef.get = vi.fn(async () => ({
        docs: [
          { data: () => ({ inventory: { quantity: 10 } }) },
          { data: () => ({ inventory: { quantity: 15 } }) }
        ]
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'variants') return mockVariantsRef;
        if (name === 'listings') return mockCollectionRef;
        return mockCollectionRef;
      });

      const result = await updateListingInventoryCount(mockDb, 'listing123');

      expect(result).toBe(25); // 10 + 15
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('should skip inventory update for service listing', async () => {
      const mockListingData = {
        type: 'service',
        title: 'Fence Repair'
      };

      mockDocRef.get = vi.fn(async () => ({
        exists: true,
        id: 'listing123',
        data: () => mockListingData
      }));

      mockCollectionRef.doc = vi.fn(() => mockDocRef);

      mockDb.collection = vi.fn((name) => {
        if (name === 'listings') return mockCollectionRef;
        return mockCollectionRef;
      });

      const result = await updateListingInventoryCount(mockDb, 'listing123');

      expect(result).toBe(0);
      expect(mockDocRef.update).not.toHaveBeenCalled();
    });
  });
});
