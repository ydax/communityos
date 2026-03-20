/**
 * Add Listing Page — The "Giant Fork" + Magic Fill
 *
 * Phase 3 evolution: Now features the MagicBox AI dropzone at the top.
 * Users can either:
 *   A) Drop a photo → AI auto-fills → review + publish (Magic Fill)
 *   B) Choose type manually → fill form → publish (Manual Flow)
 *
 * When AI returns data, it:
 *   1. Auto-selects the listing type (service/good)
 *   2. Pre-fills all form fields via controlled state
 *   3. Adds the uploaded image to the media URLs
 *   4. If goods, suggests variant axes for the user to confirm
 *
 * The user always reviews and edits before publishing — AI fills,
 * human approves.
 *
 * @module app/admin/listings/new/page
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ServiceForm from '@/components/listings/ServiceForm';
import GoodForm from '@/components/listings/GoodForm';
import MediaDropzone from '@/components/listings/MediaDropzone';
import MagicBox from '@/components/listings/MagicBox';
import { createListing } from '@/app/actions/listings';

export default function NewListingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null); // 'service' | 'good' | null
  const [mediaUrls, setMediaUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // AI-extracted prefill data (from MagicBox)
  const [aiPrefill, setAiPrefill] = useState(null);
  const [magicFillUsed, setMagicFillUsed] = useState(false);

  // TODO: Pull tenantId and siteId from authenticated session / URL params
  const tenantId = 'tenant_demo';
  const siteId = 'site_demo';

  /**
   * Handle AI-parsed data from the MagicBox.
   * Auto-selects the listing type and prepares prefill data.
   */
  const handleAiParsed = useCallback((data, mediaUrl) => {
    setAiPrefill(data);
    setMagicFillUsed(true);

    // Auto-select the listing type from AI
    if (data.type) {
      setSelectedType(data.type);
    }

    // Add the analyzed image to media URLs if not already present
    if (mediaUrl && !mediaUrls.includes(mediaUrl)) {
      setMediaUrls((prev) => [...prev, mediaUrl]);
    }
  }, [mediaUrls]);

  /**
   * Handle additional media URL from MagicBox upload.
   */
  const handleMagicMediaUrl = useCallback((url) => {
    if (url && !mediaUrls.includes(url)) {
      setMediaUrls((prev) => [...prev, url]);
    }
  }, [mediaUrls]);

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
            {magicFillUsed && (
              <span className="block mt-1 text-violet-500 text-sm font-medium">
                ✨ Created with Magic Fill
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedType(null);
                setMediaUrls([]);
                setAiPrefill(null);
                setMagicFillUsed(false);
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
                setAiPrefill(null);
                setMagicFillUsed(false);
              }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Start over
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

        {/* ── MAGIC BOX — Always visible before type selection ── */}
        {!selectedType && (
          <div className="mb-8">
            <MagicBox
              tenantId={tenantId}
              onParsed={handleAiParsed}
              onMediaUrl={handleMagicMediaUrl}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* ── Divider between Magic Box and Manual ─────────── */}
        {!selectedType && (
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              or add manually
            </span>
            <div className="flex-1 h-px bg-gray-200" />
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
            {/* Type indicator with Magic Fill badge */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-2xl">
                {selectedType === 'service' ? '🛠️' : '📦'}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">
                    {selectedType === 'service' ? 'New Service' : 'New Physical Item'}
                  </h3>
                  {magicFillUsed && (
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-xs font-medium">
                      ✨ AI Pre-filled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {magicFillUsed
                    ? 'Review the AI-suggested details and edit as needed.'
                    : 'Fill in the details below. Fields marked optional can be skipped.'}
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

            {/* Form Fork — with AI prefill data */}
            {selectedType === 'service' ? (
              <ServiceForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mediaUrls={mediaUrls}
                prefill={aiPrefill}
              />
            ) : (
              <GoodForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mediaUrls={mediaUrls}
                prefill={aiPrefill}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
