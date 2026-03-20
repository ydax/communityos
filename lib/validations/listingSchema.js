/**
 * Listing Validation Schemas (Zod)
 *
 * Runtime validation for all listing-related data.
 * Since we don't use TypeScript, Zod is our single source of truth
 * for data shape enforcement before anything touches Firestore.
 *
 * Golden Rule: Prices are ALWAYS integer cents (e.g. $75.00 → 7500).
 *
 * @module listingSchema
 */

import { z } from 'zod';

// ───────────────────────────────────────────────
// Shared Enums & Constants
// ───────────────────────────────────────────────

export const LISTING_TYPES = ['service', 'good'];
export const BILLING_MODELS = ['hourly', 'flat', 'quote'];
export const LISTING_STATUSES = ['active', 'draft', 'archived'];
export const VISIBILITY_OPTIONS = ['storefront', 'marketplace'];
export const INVENTORY_REASONS = ['initial_stock', 'sale', 'restock', 'shrinkage'];

// ───────────────────────────────────────────────
// Variant Sub-Schema (for Goods only)
// ───────────────────────────────────────────────

export const variantSchema = z.object({
  sku: z.string().optional(),
  options: z.record(z.string(), z.string()),  // e.g. { "Color": "Red", "Size": "Large" }
  priceOverride: z.number().int().positive().nullable().optional(),
  initialStock: z.number().int().nonnegative().default(0),
});

// ───────────────────────────────────────────────
// Base Listing Schema
// ───────────────────────────────────────────────

export const listingSchema = z.object({
  type: z.enum(['good', 'service']),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
  basePrice: z.number().int('Price must be a whole number (in cents)').nonnegative('Price cannot be negative'),
  mediaUrls: z.array(z.string().url()).max(5, 'Maximum 5 media files').optional().default([]),
  visibility: z.array(z.enum(['storefront', 'marketplace'])).optional().default(['storefront', 'marketplace']),

  // Service-specific fields — required when type === 'service'
  billingModel: z.enum(['hourly', 'flat', 'quote']).nullable().optional(),
  serviceRadiusMiles: z.number().nonnegative().nullable().optional(),

  // Good-specific fields — variants array
  variants: z.array(variantSchema).optional().default([]),
}).refine(
  (data) => {
    // If it's a service, billingModel must be provided
    if (data.type === 'service' && !data.billingModel) {
      return false;
    }
    return true;
  },
  {
    message: 'Services must have a billingModel (hourly, flat, or quote)',
    path: ['billingModel'],
  }
);

// Update Schema (partial — only changed fields)
// NOTE: Can't use listingSchema.partial() because Zod doesn't support
// .partial() on schemas with .refine(). Define the base shape directly.
export const listingUpdateSchema = z.object({
  type: z.enum(['good', 'service']).optional(),
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  basePrice: z.number().int().nonnegative().optional(),
  mediaUrls: z.array(z.string().url()).max(5).optional(),
  visibility: z.array(z.enum(['storefront', 'marketplace'])).optional(),
  billingModel: z.enum(['hourly', 'flat', 'quote']).nullable().optional(),
  serviceRadiusMiles: z.number().nonnegative().nullable().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
});

// ───────────────────────────────────────────────
// Inventory Log Entry Schema
// ───────────────────────────────────────────────

export const inventoryLogSchema = z.object({
  variantId: z.string().min(1),
  listingId: z.string().min(1),
  tenantId: z.string().min(1),
  quantityDelta: z.number().int(),
  reason: z.enum(['initial_stock', 'sale', 'restock', 'shrinkage']),
});

/**
 * Parse and validate raw listing form data.
 * Throws ZodError with friendly messages on failure.
 *
 * @param {Object} rawData - Unvalidated form input
 * @returns {Object} Validated and typed listing data
 */
export function parseListingData(rawData) {
  return listingSchema.parse(rawData);
}

/**
 * Safe parse — returns { success, data, error } instead of throwing.
 * Preferred for form validation where you want to show inline errors.
 *
 * @param {Object} rawData - Unvalidated form input
 * @returns {{ success: boolean, data?: Object, error?: import('zod').ZodError }}
 */
export function safeParseListingData(rawData) {
  return listingSchema.safeParse(rawData);
}
