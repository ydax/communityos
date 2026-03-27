/**
 * Tenant Storefront Listing Page
 *
 * Renders a specific listing for a tenant.
 * URL: [tenantId].centraltexas.com/shop/[listingId]
 * (Middleware rewrites this to app/[siteId]/shop/[listingId]/page.js)
 *
 * @module app/[siteId]/shop/[listingId]/page
 */

import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/dbServices/listingsService';
import Image from 'next/image';

export default async function TenantListingPage({ params }) {
  // Await the entire params object before destructuring per Next.js 15+ best practices
  const resolvedParams = await params;
  const { domain, listingId } = resolvedParams;

  const listing = await getListingById(listingId);

  // If the listing doesn't exist or doesn't belong to this tenant, return 404
  if (!listing || listing.tenantId !== domain) {
    notFound();
  }

  // Format price
  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Basic Tenant Header (can be expanded later to pull vibe config) */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            {domain} Storefront
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            
            {/* Media Gallery (simplified) */}
            <div className="space-y-4">
              {listing.mediaUrls && listing.mediaUrls.length > 0 ? (
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative border border-gray-200">
                  {listing.mediaUrls[0].match(/\.(mp4|webm|mov|quicktime)($|\?)/i) ? (
                    <video 
                      src={listing.mediaUrls[0]} 
                      className="w-full h-full object-cover"
                      controls 
                    />
                  ) : (
                    <img
                      src={listing.mediaUrls[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-4xl">📸</span>
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium uppercase tracking-wider">
                  {listing.type}
                </span>
                {listing.type === 'service' && listing.billingModel && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                    {listing.billingModel}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {listing.title}
              </h1>
              
              <div className="text-2xl font-bold text-gray-900 mb-6">
                {formatPrice(listing.basePrice)}
                {listing.type === 'service' && listing.billingModel === 'hourly' && (
                  <span className="text-lg text-gray-500 font-normal"> /hr</span>
                )}
              </div>
              
              <p className="text-gray-600 leading-relaxed mb-8">
                {listing.description || 'No description provided.'}
              </p>

              <div className="mt-auto">
                <button className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-md">
                  Buy Now
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
