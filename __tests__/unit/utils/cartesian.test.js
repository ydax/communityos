/**
 * Unit Tests — Cartesian Variant Generator
 *
 * Tests the pure-function SKU matrix generator that powers
 * the physical goods variant system.
 */

import { describe, it, expect } from 'vitest';
import {
  generateVariantMatrix,
  generateSKUs,
  buildVariantData,
} from '../../../utils/cartesian';

describe('generateVariantMatrix', () => {
  it('should return empty array for no options', () => {
    expect(generateVariantMatrix({})).toEqual([]);
  });

  it('should handle a single axis with one value', () => {
    const result = generateVariantMatrix({ Color: ['Red'] });
    expect(result).toEqual([{ Color: 'Red' }]);
  });

  it('should handle a single axis with multiple values', () => {
    const result = generateVariantMatrix({ Size: ['S', 'M', 'L'] });
    expect(result).toEqual([
      { Size: 'S' },
      { Size: 'M' },
      { Size: 'L' },
    ]);
  });

  it('should produce correct Cartesian product of two axes', () => {
    const result = generateVariantMatrix({
      Color: ['Red', 'Blue'],
      Size: ['S', 'L'],
    });
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      { Color: 'Red', Size: 'S' },
      { Color: 'Red', Size: 'L' },
      { Color: 'Blue', Size: 'S' },
      { Color: 'Blue', Size: 'L' },
    ]);
  });

  it('should handle three axes correctly', () => {
    const result = generateVariantMatrix({
      Color: ['Red', 'Blue'],
      Size: ['S', 'L'],
      Material: ['Cotton'],
    });
    expect(result).toHaveLength(4); // 2 * 2 * 1
    expect(result[0]).toEqual({ Color: 'Red', Size: 'S', Material: 'Cotton' });
  });

  it('should skip axes with empty arrays', () => {
    const result = generateVariantMatrix({
      Color: ['Red'],
      Size: [],
    });
    expect(result).toEqual([{ Color: 'Red' }]);
  });

  it('should return empty array when all axes have empty arrays', () => {
    expect(generateVariantMatrix({ Color: [], Size: [] })).toEqual([]);
  });
});

describe('generateSKUs', () => {
  it('should generate SKUs from title prefix and options', () => {
    const combos = [{ Color: 'Red', Size: 'Large' }];
    const skus = generateSKUs('Branded T-Shirt', combos);
    expect(skus).toEqual(['BRANDED-TSHIRT-RED-LARGE']);
  });

  it('should handle multiple combinations', () => {
    const combos = [
      { Color: 'Red', Size: 'S' },
      { Color: 'Blue', Size: 'L' },
    ];
    const skus = generateSKUs('Item', combos);
    expect(skus).toHaveLength(2);
    expect(skus[0]).toContain('ITEM');
    expect(skus[1]).toContain('ITEM');
  });

  it('should strip special characters from title', () => {
    const combos = [{ Color: 'Red' }];
    const skus = generateSKUs("Joe's Fence-Kit!", combos);
    expect(skus[0]).toMatch(/^JOES-FENCEKIT-RED$/);
  });
});

describe('buildVariantData', () => {
  it('should build complete variant objects with defaults', () => {
    const result = buildVariantData('T-Shirt', { Color: ['Red'] }, 10);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      sku: expect.any(String),
      options: { Color: 'Red' },
      priceOverride: null,
      initialStock: 10,
    });
  });

  it('should default stock to 0', () => {
    const result = buildVariantData('Item', { Size: ['S'] });
    expect(result[0].initialStock).toBe(0);
  });

  it('should generate all Cartesian variants', () => {
    const result = buildVariantData('Candle', {
      Scent: ['Lavender', 'Vanilla'],
      Size: ['Small', 'Large'],
    }, 5);
    expect(result).toHaveLength(4);
    result.forEach((v) => {
      expect(v.initialStock).toBe(5);
      expect(v.priceOverride).toBeNull();
      expect(v.sku).toBeTruthy();
    });
  });
});
