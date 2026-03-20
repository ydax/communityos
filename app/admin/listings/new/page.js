/**
 * Add Listing Page — The "Giant Fork"
 *
 * The Anti-Design UX in action:
 *   1. User sees two prominent cards: "Offer a Service" vs "Sell a Physical Item"
 *   2. Clicking one reveals the appropriate form (ServiceForm or GoodForm)
 *   3. Photos upload directly to Firebase Storage (no Blob in Server Actions)
 *   4. Form data is validated with Zod and written via Server Action (batched)
 *
 * This page is the nucleus of Milestone 1.2 and routes through to the
 * createListing Server Action (Milestone 1.3).
 *
 * @module app/admin/listings/new/page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ServiceForm from '@/components/listings/ServiceForm';
import GoodForm from '@/components/listings/GoodForm';
import MediaDropzone from '@/components/listings/MediaDropzone';
import { createListing } from '@/app/actions/listings';

export default function NewListingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null); // 'service' | 'good' | null
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // TODO: Pull tenantId and siteId from authenticated session / URL params
  const tenantId = 'tenant_demo';
  const siteId = 'site_demo';

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createListing(formData, tenantId, siteId);

      if (result.success) {
        setSuccess(true);
        // Brief celebration moment before redirect
        setTimeout(() => {
          router.push('/admin/listings');
        }, 2000);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      console.error('[NewListingPage] Submission error:', err);
      setError('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SUCCESS STATE ──────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Published!
          </h2>
          <p className="text-gray-500 mb-6">
            Your listing is now live on your storefront and the CentralTexas marketplace.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedType(null);
                setMediaUrls([]);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Add Another
            </button>
            <Link
              href="/admin/listings"
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              View All Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN WIZARD ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/admin/listings"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              ← Back to Listings
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mt-0.5">
              Add a Listing
            </h1>
          </div>
          {selectedType && (
            <button
              onClick={() => {
                setSelectedType(null);
                setError(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Change type
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-700">Failed to create listing</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── STEP 1: The Binary Fork ──────────────────────── */}
        {!selectedType && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                What would you like to list?
              </h2>
              <p className="text-gray-500 mt-2">
                Choose one to get started. You can always add more later.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service Card */}
              <button
                onClick={() => setSelectedType('service')}
                className="group p-8 bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-400 hover:shadow-lg transition-all text-left"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  🛠️
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Offer a Service
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Fence repair, guitar lessons, catering, photography, consulting — anything you do for clients.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Hourly', 'Flat Rate', 'Quote'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              {/* Good Card */}
              <button
                onClick={() => setSelectedType('good')}
                className="group p-8 bg-white rounded-2xl border-2 border-gray-100 hover:border-emerald-400 hover:shadow-lg transition-all text-left"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  📦
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Sell a Physical Item
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  T-shirts, candles, art, food products, crafts — anything you make or stock.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['SKU Variants', 'Inventory', 'Shipping'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Media Upload + Form ──────────────────── */}
        {selectedType && (
          <div className="space-y-8 animate-fadeIn">
            {/* Type indicator */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl">
                {selectedType === 'service' ? '🛠️' : '📦'}
              </span>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  {selectedType === 'service' ? 'New Service' : 'New Physical Item'}
                </h3>
                <p className="text-xs text-gray-400">
                  Fill in the details below. Fields marked optional can be skipped.
                </p>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photos
                <span className="font-normal text-gray-400 ml-1">(up to 5)</span>
              </label>
              <MediaDropzone
                tenantId={tenantId}
                urls={mediaUrls}
                onUrlsChange={setMediaUrls}
                maxFiles={5}
                disabled={isSubmitting}
              />
            </div>

            {/* Form Fork */}
            {selectedType === 'service' ? (
              <ServiceForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mediaUrls={mediaUrls}
              />
            ) : (
              <GoodForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mediaUrls={mediaUrls}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
