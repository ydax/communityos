"use client";

import { useState, useRef } from "react";

/**
 * AddListingStep Component
 *
 * Final onboarding step: add first listing/service to activate the site
 * and push it to the CentralTexas.com marketplace.
 *
 * Camera-first UI: photo → title → price → publish
 *
 * @param {Object} props
 * @param {string} props.siteId - The newly created site ID
 * @param {string} props.category - Business category
 * @param {Function} props.onComplete - Called when listing is published
 * @param {Function} props.onSkip - Called if user wants to skip this step
 */
export default function AddListingStep({
  siteId,
  category,
  onComplete,
  onSkip,
}) {
  const [listing, setListing] = useState({
    title: "",
    description: "",
    price: "",
    type: "service",
    imageFile: null,
    imagePreview: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setListing((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: ev.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!listing.title.trim()) {
      setError("Give your service a title");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload image if present
      let imageUrl = null;
      if (listing.imageFile) {
        const formData = new FormData();
        formData.append("file", listing.imageFile);
        formData.append("path", `listings/${siteId}`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      // Create listing
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          title: listing.title.trim(),
          description:
            listing.description.trim() || `Professional ${category} service`,
          type: listing.type,
          category,
          pricing: {
            model: listing.price ? "flat_rate" : "quote_required",
            basePrice: listing.price ? parseFloat(listing.price) : null,
            unit: "project",
          },
          images: imageUrl ? [imageUrl] : [],
          availability: { isAvailable: true },
          status: "active",
        }),
      });

      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create listing");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Motivational header */}
      <div className="text-center">
        <div className="text-4xl mb-2">🎯</div>
        <h3 className="text-xl font-bold text-gray-800">
          Let&apos;s get you some customers
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          Add your first service to make your site live AND push it to the
          CentralTexas.com marketplace.
        </p>
      </div>

      {/* Photo upload - Camera-first */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />

        {listing.imagePreview ? (
          <div className="relative rounded-xl overflow-hidden shadow-md">
            <img
              src={listing.imagePreview}
              alt="Service preview"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-white bg-opacity-90 rounded-lg text-sm font-medium text-gray-700 shadow"
            >
              📷 Change Photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-4xl">📸</div>
            <span className="text-sm font-medium text-gray-500">
              Tap to add a photo
            </span>
            <span className="text-xs text-gray-400">
              Show off your best work!
            </span>
          </button>
        )}
      </div>

      {/* Service details */}
      <div className="space-y-4">
        <input
          type="text"
          value={listing.title}
          onChange={(e) => setListing((p) => ({ ...p, title: e.target.value }))}
          placeholder="Service name (e.g., Fence Repair, Plumbing Inspection)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          disabled={isSubmitting}
          maxLength={100}
        />

        <textarea
          value={listing.description}
          onChange={(e) =>
            setListing((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="Brief description (optional)"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
          rows={2}
          disabled={isSubmitting}
          maxLength={500}
        />

        <div className="relative">
          <span className="absolute left-4 top-3 text-gray-400 text-base">
            $
          </span>
          <input
            type="number"
            value={listing.price}
            onChange={(e) =>
              setListing((p) => ({ ...p, price: e.target.value }))
            }
            placeholder="Price (leave blank for 'Contact for quote')"
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            disabled={isSubmitting}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !listing.title.trim()}
          className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg transition-all hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Publishing...
            </span>
          ) : (
            "🚀 Publish My Site"
          )}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="w-full px-6 py-3 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
        >
          Skip for now — I'll add listings later
        </button>
      </div>
    </div>
  );
}
