import { adminDb } from "@/lib/firebase/admin";
import {
  getSiteByDomain,
  getSiteByCustomDomain,
} from "@/lib/dbServices/sitesService";
import CheckoutPageClient from "./CheckoutPageClient";

/**
 * Standalone Domain Checkout Page
 * Server-side: resolves the vendor's site config and Stripe Connect ID
 * Client-side: renders CheckoutForm with Stripe Elements
 */
export default async function CheckoutPage({ params }) {
  const fullDomain = params.domain.includes(".")
    ? params.domain
    : `${params.domain}.centraltexas.com`;

  let site = await getSiteByDomain(adminDb, fullDomain);

  if (!site && fullDomain.includes(".") && !fullDomain.endsWith(".centraltexas.com")) {
    site = await getSiteByCustomDomain(adminDb, fullDomain);
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h1>
          <p className="text-gray-500">Unable to load checkout for this store.</p>
        </div>
      </div>
    );
  }

  return (
    <CheckoutPageClient
      siteId={site.id}
      siteName={site.businessName || "Store"}
      stripeAccountId={site.stripeAccountId || null}
    />
  );
}

export async function generateMetadata({ params }) {
  const fullDomain = params.domain.includes(".")
    ? params.domain
    : `${params.domain}.centraltexas.com`;

  let site = await getSiteByDomain(adminDb, fullDomain);
  if (!site && fullDomain.includes(".") && !fullDomain.endsWith(".centraltexas.com")) {
    site = await getSiteByCustomDomain(adminDb, fullDomain);
  }

  return {
    title: site ? `Checkout — ${site.businessName}` : "Checkout",
  };
}
