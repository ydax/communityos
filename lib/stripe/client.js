/**
 * Stripe Client-Side Loader
 *
 * WHY: CivicOS needs two distinct Stripe initialization modes:
 *
 * 1. **Standalone vendor domains (Direct Charges):** Stripe is loaded
 *    with the vendor's Connect account ID so the Payment Element renders
 *    under their account. Buyers see "Joe's Fencing" on their statement.
 *
 * 2. **Marketplace (`centraltexas.com`):** Stripe loads on the CivicOS
 *    platform account. Multi-vendor carts use a `transfer_group` and
 *    separate post-payment transfers.
 *
 * This module provides a memoized loader that handles both cases.
 */

import { loadStripe } from "@stripe/stripe-js";

// Cache Stripe instances to avoid re-initialization
const stripeCache = new Map();

/**
 * Get a memoized Stripe instance
 *
 * @param {string} [connectedAccountId] - Optional Stripe Connect account ID.
 *   Pass this when rendering checkout on a standalone vendor domain (Direct Charges).
 *   Omit for marketplace checkout (platform account).
 * @returns {Promise<import('@stripe/stripe-js').Stripe|null>} Stripe instance
 */
export function getStripePromise(connectedAccountId = null) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.error("[getStripePromise] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    return null;
  }

  // Use the connected account ID (or 'platform') as the cache key
  const cacheKey = connectedAccountId || "platform";

  if (!stripeCache.has(cacheKey)) {
    const options = connectedAccountId
      ? { stripeAccount: connectedAccountId }
      : {};

    stripeCache.set(cacheKey, loadStripe(publishableKey, options));
  }

  return stripeCache.get(cacheKey);
}
