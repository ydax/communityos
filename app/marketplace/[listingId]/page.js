/**
 * Global Marketplace Listing Page
 *
 * Renders a specific listing for the global CentralTexas.com marketplace.
 * URL: centraltexas.com/marketplace/[listingId]
 * Allows cross-pollination of local goods and services.
 *
 * @module app/marketplace/[listingId]/page
 */

import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/dbServices/listingsService';
import Link from 'next/link';

export default async function MarketplaceListingPage({ params }) {
  // Await the entire params object before destructuring per Next.js 15+ best practices
  const resolvedParams = await params;
  const { listingId } = resolvedParams;

  const listing = await getListingById(listingId);

  // If the listing doesn't exist or isn't marketplace visible, return 404
  if (!listing || !listing.visibility?.includes('marketplace')) {
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
      {/* Global Marketplace Header */}
      <header className="bg-blue-900 border-b border-blue-800 py-4 px-6 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤠</span>
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">
              CentralTexas.com Marketplace
            </Link>
          </div>
          <nav className="text-sm font-medium text-blue-200">
            <Link href="/marketplace" className="hover:text-white transition-colors">Browse All</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Marketplace contextual breadcrumb / tenant link */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/marketplace" className="hover:text-gray-900 transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="capitalize">{listing.type}s</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Offered by <span className="text-blue-600">{listing.tenantId}</span></span>
        </div>

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

              <div className="mt-auto space-y-3">
                <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md">
                  Buy on CentralTexas.com
                </button>
                <div className="text-center text-xs text-gray-500">
                  Secure checkout via Stripe Connect
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
