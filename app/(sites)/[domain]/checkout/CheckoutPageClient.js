"use client";

/**
 * Client-side wrapper for the standalone checkout page
 * Needed because CheckoutForm uses client-side hooks (Stripe, Cart)
 */

import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function CheckoutPageClient({ siteId, siteName, stripeAccountId }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutForm
        context="standalone"
        siteId={siteId}
        stripeAccountId={stripeAccountId}
        siteName={siteName}
      />
    </div>
  );
}
