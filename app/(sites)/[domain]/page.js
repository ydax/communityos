import { adminDb } from "../../../lib/firebase/admin.js";
import {
  getSiteByDomain,
  getSiteByCustomDomain,
} from "../../../lib/dbServices/sitesService.js";
import SiteRenderer from "../../../components/sites/SiteRenderer.js";

/**
 * Multi-Tenant Site Page
 * Renders custom domain sites based on domain from middleware
 *
 * @param {Object} params - Route parameters
 * @param {string} params.domain - Domain slug or custom domain (injected by middleware rewrite)
 */
export default async function SitePage({ params }) {
  // Reconstruct full domain from URL segment
  // If domain contains a dot, it's a custom domain (e.g., "ctx.us" or "davidsplumbing.com")
  // Otherwise, it's a subdomain slug (e.g., "test-fencing" -> "test-fencing.centraltexas.com")
  const fullDomain = params.domain.includes(".")
    ? params.domain
    : `${params.domain}.centraltexas.com`;

  try {
    // First: try standard domain lookup (matches subdomain field like "davidsplumbing.centraltexas.com")
    let site = await getSiteByDomain(adminDb, fullDomain);

    // Fallback: if not found by domain, try customDomain lookup (matches TLDs like "davidsplumbing.com")
    if (
      !site &&
      fullDomain.includes(".") &&
      !fullDomain.endsWith(".centraltexas.com")
    ) {
      site = await getSiteByCustomDomain(adminDb, fullDomain);
    }

    if (!site) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Site Configuration Error
            </h1>
            <p className="text-gray-600">Unable to load site configuration.</p>
          </div>
        </div>
      );
    }

    // Render site with configuration
    return <SiteRenderer site={site} />;
  } catch (error) {
    console.error("[SitePage] Error rendering site:", {
      domain: fullDomain,
      error: error.message,
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Site
          </h1>
          <p className="text-gray-600 mb-4">
            An error occurred while loading this site.
          </p>
          <p className="text-sm text-gray-500">Domain: {fullDomain}</p>
        </div>
      </div>
    );
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }) {
  // Reconstruct full domain from URL segment
  const fullDomain = params.domain.includes(".")
    ? params.domain
    : `${params.domain}.centraltexas.com`;

  try {
    let site = await getSiteByDomain(adminDb, fullDomain);

    // Fallback: try customDomain lookup for TLDs
    if (
      !site &&
      fullDomain.includes(".") &&
      !fullDomain.endsWith(".centraltexas.com")
    ) {
      site = await getSiteByCustomDomain(adminDb, fullDomain);
    }

    if (!site) {
      return {
        title: "Site Not Found",
      };
    }

    return {
      title: site.businessName || "Welcome",
      description: `${site.businessName} - Powered by CentralTexas.com`,
      openGraph: {
        title: site.businessName,
        description: `Visit ${site.businessName} on CentralTexas.com`,
      },
    };
  } catch (error) {
    console.error("[generateMetadata] Error:", error);
    return {
      title: "Site",
    };
  }
}
