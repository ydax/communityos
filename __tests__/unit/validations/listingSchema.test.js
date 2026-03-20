/**
 * Unit Tests — Listing Zod Schema Validation
 *
 * Validates that the Zod schemas enforce all Golden Rules:
 *  - Prices as integer cents
 *  - Required billingModel for services
 *  - Structured variant options
 */

import { describe, it, expect } from 'vitest';
import {
  listingSchema,
  parseListingData,
  safeParseListingData,
  variantSchema,
  inventoryLogSchema,
} from '../../../lib/validations/listingSchema';

describe('listingSchema', () => {
  const validService = {
    type: 'service',
    title: 'Cedar Fence Repair',
    description: 'Hourly fence repair for residential and commercial properties',
    basePrice: 7500,
    billingModel: 'hourly',
    serviceRadiusMiles: 25,
    mediaUrls: [],
  };

  const validGood = {
    type: 'good',
    title: 'Branded T-Shirt',
    basePrice: 2499,
    mediaUrls: ['https://example.com/tshirt.jpg'],
    variants: [
      {
        sku: 'TSHIRT-RED-L',
        options: { Color: 'Red', Size: 'Large' },
        priceOverride: null,
        initialStock: 15,
      },
    ],
  };

  describe('service listings', () => {
    it('should accept a valid service listing', () => {
      const result = listingSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it('should reject a service without billingModel', () => {
      const result = listingSchema.safeParse({
        ...validService,
        billingModel: null,
      });
      expect(result.success).toBe(false);
    });

    it('should accept a quote-type service with zero price', () => {
      const result = listingSchema.safeParse({
        ...validService,
        billingModel: 'quote',
        basePrice: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid billingModel values', () => {
      const result = listingSchema.safeParse({
        ...validService,
        billingModel: 'monthly',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('good listings', () => {
    it('should accept a valid good listing', () => {
      const result = listingSchema.safeParse(validGood);
      expect(result.success).toBe(true);
    });

    it('should accept a good without variants (simple product)', () => {
      const { variants, ...noVariants } = validGood;
      const result = listingSchema.safeParse(noVariants);
      expect(result.success).toBe(true);
    });

    it('should accept a good with empty variants array', () => {
      const result = listingSchema.safeParse({
        ...validGood,
        variants: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('price validation (The Money Rule)', () => {
    it('should reject float prices', () => {
      const result = listingSchema.safeParse({
        ...validService,
        basePrice: 49.99,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const result = listingSchema.safeParse({
        ...validService,
        basePrice: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should accept zero price', () => {
      const result = listingSchema.safeParse({
        ...validService,
        basePrice: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should accept large cent values', () => {
      const result = listingSchema.safeParse({
        ...validService,
        basePrice: 999900, // $9,999.00
      });
      expect(result.success).toBe(true);
    });
  });

  describe('title validation', () => {
    it('should reject titles shorter than 3 characters', () => {
      const result = listingSchema.safeParse({
        ...validService,
        title: 'AB',
      });
      expect(result.success).toBe(false);
    });

    it('should reject titles longer than 100 characters', () => {
      const result = listingSchema.safeParse({
        ...validService,
        title: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('mediaUrls validation', () => {
    it('should reject invalid URLs', () => {
      const result = listingSchema.safeParse({
        ...validService,
        mediaUrls: ['not-a-url'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 media URLs', () => {
      const result = listingSchema.safeParse({
        ...validService,
        mediaUrls: Array(6).fill('https://example.com/img.jpg'),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('type validation', () => {
    it('should reject invalid types', () => {
      const result = listingSchema.safeParse({
        ...validService,
        type: 'subscription',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseListingData', () => {
  it('should throw on invalid data', () => {
    expect(() => parseListingData({})).toThrow();
  });

  it('should return parsed data for valid input', () => {
    const data = parseListingData({
      type: 'service',
      title: 'Test Service',
      basePrice: 1000,
      billingModel: 'flat',
    });
    expect(data.type).toBe('service');
    expect(data.basePrice).toBe(1000);
  });
});

describe('safeParseListingData', () => {
  it('should return success: false for invalid data', () => {
    const result = safeParseListingData({});
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return success: true with data for valid input', () => {
    const result = safeParseListingData({
      type: 'good',
      title: 'Test Good',
      basePrice: 500,
    });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Test Good');
  });
});

describe('variantSchema', () => {
  it('should accept a valid variant', () => {
    const result = variantSchema.safeParse({
      sku: 'TEST-SKU',
      options: { Color: 'Red' },
      initialStock: 10,
    });
    expect(result.success).toBe(true);
  });

  it('should reject non-integer stock via parent schema', () => {
    const result = listingSchema.safeParse({
      type: 'good',
      title: 'Test Good',
      basePrice: 1000,
      variants: [{
        sku: 'SKU-1',
        options: { Color: 'Red' },
        initialStock: 5.5,
      }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative stock via parent schema', () => {
    const result = listingSchema.safeParse({
      type: 'good',
      title: 'Test Good',
      basePrice: 1000,
      variants: [{
        sku: 'SKU-1',
        options: { Color: 'Red' },
        initialStock: -1,
      }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept variant with optional sku omitted', () => {
    const result = variantSchema.safeParse({
      options: { Size: 'Large' },
      initialStock: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe('inventoryLogSchema', () => {
  it('should accept a valid inventory log entry', () => {
    const result = inventoryLogSchema.safeParse({
      variantId: 'var_123',
      listingId: 'list_456',
      tenantId: 'ten_789',
      quantityDelta: 15,
      reason: 'initial_stock',
    });
    expect(result.success).toBe(true);
  });

  it('should accept negative quantityDelta for sales', () => {
    const result = inventoryLogSchema.safeParse({
      variantId: 'var_123',
      listingId: 'list_456',
      tenantId: 'ten_789',
      quantityDelta: -3,
      reason: 'sale',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid reason values', () => {
    const result = inventoryLogSchema.safeParse({
      variantId: 'var_123',
      listingId: 'list_456',
      tenantId: 'ten_789',
      quantityDelta: 5,
      reason: 'magic',
    });
    expect(result.success).toBe(false);
  });
});
