"use client";

/**
 * Marketplace Checkout Page
 *
 * Multi-vendor checkout on centraltexas.com/marketplace/checkout.
 * Uses the platform Stripe account (no connected account ID needed).
 * Vendor transfers happen post-payment via the webhook.
 */

import CheckoutForm from "@/components/checkout/CheckoutForm";

export default function MarketplaceCheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutForm
        context="marketplace"
        siteId="marketplace"
        stripeAccountId={null}
        siteName="CentralTexas.com Marketplace"
      />
    </div>
  );
}
