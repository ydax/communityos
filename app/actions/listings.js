/**
 * Listings Server Actions
 *
 * "use server" — These functions run exclusively on the server.
 * They handle Zod validation + Firestore Batched Writes for atomic
 * listing creation across `listings`, `variants`, and `inventory` collections.
 *
 * Golden Rules Enforced:
 *  1. Validation Rule  — All data parsed through Zod before touching the DB.
 *  2. Upload Rule      — Only string URLs are accepted, never File/Blob objects.
 *  3. Money Rule       — Prices stored as integer cents.
 *  4. Database Rule    — Physical goods use Batched Writes across 3 collections.
 *
 * @module actions/listings
 */

'use server';

import { adminDb } from '@/lib/firebase/admin';
import { listingSchema } from '@/lib/validations/listingSchema';
import Stripe from 'stripe';

/**
 * Generate a deterministic SKU string from a listing title and variant options.
 *
 * @param {string} title - Listing title  (e.g. "Branded T-Shirt")
 * @param {Object} options - Variant options object (e.g. { Color: "Red", Size: "L" })
 * @returns {string} SKU like "BRANDED-TSHIRT-RED-L"
 */
function generateSKU(title, options) {
  const prefix = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .join('-');

  const optionParts = Object.values(options)
    .map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
    .join('-');

  return `${prefix}-${optionParts}`;
}

/**
 * Create a new listing with full Zod validation and atomic Firestore writes.
 *
 * For "good" type listings with variants, this creates documents in three
 * collections within a single batch:
 *   1. `listings/{id}`     — The parent listing document
 *   2. `variants/{id}`     — One per SKU combination
 *   3. `inventory/{id}`    — Initial stock ledger entry per variant
 *
 * For "service" type listings, only the listing document is created.
 *
 * @param {Object} rawFormData - Unvalidated form data from the client
 * @param {string} tenantId    - Authenticated tenant identifier (from session)
 * @param {string} siteId      - The site this listing belongs to
 * @returns {Promise<{ success: boolean, listingId?: string, error?: string }>}
 */
export async function createListing(rawFormData, tenantId, siteId) {
  // ── Step 1: Validate with Zod ─────────────────────────────────
  let data;
  try {
    data = listingSchema.parse(rawFormData);
  } catch (zodError) {
    console.error('[createListing] Zod validation failed:', zodError.errors);
    return {
      success: false,
      error: zodError.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    };
  }

  // ── Step 2: Build the batch ───────────────────────────────────
  try {
    const batch = adminDb.batch();
    const now = Date.now();

    // 2a. Create the listing document
    const listingRef = adminDb.collection('listings').doc();
    const listingDoc = {
      id: listingRef.id,
      tenantId,
      siteId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      basePrice: data.basePrice,
      mediaUrls: data.mediaUrls || [],
      visibility: data.visibility || ['storefront', 'marketplace'],
      status: 'active',
      createdAt: now,
      updatedAt: now,

      // Service-specific (null for goods)
      billingModel: data.type === 'service' ? data.billingModel : null,
      serviceRadiusMiles: data.type === 'service' ? (data.serviceRadiusMiles ?? null) : null,
    };

    batch.set(listingRef, listingDoc);

    // 2b. For goods — create variants + initial inventory ledger entries
    if (data.type === 'good' && data.variants && data.variants.length > 0) {
      for (const variant of data.variants) {
        const variantRef = adminDb.collection('variants').doc();
        const sku = variant.sku || generateSKU(data.title, variant.options);

        batch.set(variantRef, {
          id: variantRef.id,
          listingId: listingRef.id,
          tenantId,
          sku,
          options: variant.options,
          priceOverride: variant.priceOverride ?? null,
          currentStock: variant.initialStock || 0,
          createdAt: now,
        });

        // Only create an inventory log if there's initial stock
        if (variant.initialStock > 0) {
          const invRef = adminDb.collection('inventory').doc();
          batch.set(invRef, {
            id: invRef.id,
            variantId: variantRef.id,
            listingId: listingRef.id,
            tenantId,
            quantityDelta: variant.initialStock,
            reason: 'initial_stock',
            timestamp: now,
          });
        }
      }
    }

    // ── Step 3: Commit atomically ─────────────────────────────────
    await batch.commit();

    console.log(`[createListing] ✅ Listing created: ${listingRef.id} (type=${data.type}, variants=${data.variants?.length || 0})`);

    // ── Step 4: Sync with Stripe (Best Effort) ────────────────────
    let stripeProductId = null;
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        // Init Stripe (using API version for stability)
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2024-06-20', // Current version or latest
        });

        // 1. Create the Stripe Product
        const product = await stripe.products.create({
          name: data.title,
          description: data.description || '',
          images: data.mediaUrls && data.mediaUrls.length > 0 ? data.mediaUrls.slice(0, 8) : [],
          metadata: {
            listingId: listingRef.id,
            tenantId,
            siteId,
            type: data.type,
          },
        });
        stripeProductId = product.id;

        // 2. Create the Stripe Price(s)
        if (data.type === 'service' || !data.variants || data.variants.length === 0) {
          // Single base price
          await stripe.prices.create({
            product: stripeProductId,
            unit_amount: data.basePrice,
            currency: 'usd',
          });
        } else {
          // One price per variant
          for (const variant of data.variants) {
            const sku = variant.sku || generateSKU(data.title, variant.options);
            await stripe.prices.create({
              product: stripeProductId,
              unit_amount: variant.priceOverride ?? data.basePrice,
              currency: 'usd',
              metadata: { sku },
            });
          }
        }

        // 3. Update the Firestore listing with the Stripe ID
        await adminDb.collection('listings').doc(listingRef.id).update({
          stripeProductId,
        });

        console.log(`[createListing] ✅ Stripe sync complete: ${stripeProductId}`);
      } else {
        console.warn('[createListing] STRIPE_SECRET_KEY not set. Skipping Stripe sync.');
      }
    } catch (stripeError) {
      console.error('[createListing] ⚠️ Stripe sync failed, but listing was saved:', stripeError.message);
      // We don't fail the whole action here. The listing is safely in Firestore.
      // In production, you might write to a dead-letter queue for retry.
    }

    return { success: true, listingId: listingRef.id };
  } catch (error) {
    console.error('[createListing] Firestore batch write failed:', error);
    return {
      success: false,
      error: 'Failed to save listing. Please try again.',
    };
  }
}

/**
 * Update an existing listing. Partial updates are supported.
 *
 * @param {string} listingId - The listing document ID
 * @param {Object} updates   - Partial listing fields
 * @param {string} tenantId  - Must match the listing's tenantId for security
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateListingAction(listingId, updates, tenantId) {
  try {
    const listingRef = adminDb.collection('listings').doc(listingId);
    const doc = await listingRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Listing not found' };
    }

    // Security check — tenant must own the listing
    if (doc.data().tenantId !== tenantId) {
      return { success: false, error: 'Unauthorized' };
    }

    await listingRef.update({
      ...updates,
      updatedAt: Date.now(),
    });

    console.log(`[updateListingAction] ✅ Listing updated: ${listingId}`);
    return { success: true };
  } catch (error) {
    console.error('[updateListingAction] Error:', error);
    return { success: false, error: 'Failed to update listing' };
  }
}

/**
 * Archive (soft-delete) a listing.
 *
 * @param {string} listingId - The listing document ID
 * @param {string} tenantId  - Must match the listing's tenantId for security
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function archiveListingAction(listingId, tenantId) {
  return updateListingAction(listingId, { status: 'archived' }, tenantId);
}
