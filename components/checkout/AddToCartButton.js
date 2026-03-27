"use client";

/**
 * AddToCartButton — Reusable CTA for listing cards and detail pages
 *
 * Handles variant selection, quantity, and CartProvider integration.
 * Designed to be theme-aware and drop into any service/product card.
 */

import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCartButton({
  listing,
  site,
  variant = null,
  className = "",
  size = "md",
}) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const unitPrice = variant
      ? Math.round(variant.price * 100)
      : Math.round((listing.pricing?.basePrice || 0) * 100);

    addToCart({
      listingId: listing.id,
      vendorSiteId: site.id,
      vendorName: site.businessName || "",
      title: variant ? `${listing.title} - ${variant.name}` : listing.title,
      unitPrice,
      variantId: variant?.id || null,
      variantName: variant?.name || null,
      imageUrl: listing.imageUrl || listing.images?.[0] || null,
      quantity,
    });

    // Brief success flash
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-7 py-3 text-lg",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {listing.type === "good" && (
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-3 py-1 text-sm font-medium tabular-nums min-w-[2rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={added}
        className={`
          relative font-semibold rounded-lg
          transition-all duration-300 ease-out
          ${sizeClasses[size]}
          ${added
            ? "bg-green-500 text-white scale-95"
            : "bg-gray-900 text-white hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02] active:scale-95"
          }
          disabled:cursor-not-allowed
        `}
        aria-label={`Add ${listing.title} to cart`}
      >
        <span
          className={`transition-opacity duration-200 ${added ? "opacity-0" : "opacity-100"}`}
        >
          {listing.type === "service" ? "Book Now" : "Add to Cart"}
        </span>

        {added && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 animate-[scale-in_0.3s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
