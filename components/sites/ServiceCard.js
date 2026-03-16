"use client";

import { useState } from "react";
import clsx from "clsx";
import ServiceModal from "./ServiceModal";
import BookingButton from "./BookingButton";

/**
 * ServiceCard Component - Modern Shopify-inspired design
 * Individual service card for display
 *
 * @param {Object} props - Component props
 * @param {Object} props.service - Service data
 * @param {string} props.theme - Site theme ('maker', 'trade', 'venue')
 * @param {boolean} props.showDetails - Show detail modal on click
 */
export default function ServiceCard({
  service,
  theme = "trade",
  showDetails = true,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = () => {
    if (service.pricing?.model === "quote_required") {
      return "Quote Required";
    }
    if (service.pricing?.basePrice) {
      const unit = service.pricing.unit || "project";
      return `$${service.pricing.basePrice.toFixed(2)}/${unit}`;
    }
    return "Contact for pricing";
  };

  const imageUrl =
    service.images && service.images.length > 0
      ? service.images[0]
      : "/placeholder-service.png";

  const themeColors = {
    maker: {
      primary: "text-maker-primary",
      bg: "bg-maker-primary",
      border: "border-maker-primary",
      accent: "bg-maker-accent",
    },
    trade: {
      primary: "text-trade-primary",
      bg: "bg-trade-primary",
      border: "border-trade-primary",
      accent: "bg-trade-accent",
    },
    venue: {
      primary: "text-venue-primary",
      bg: "bg-venue-primary",
      border: "border-venue-primary",
      accent: "bg-venue-accent",
    },
  };

  const colors = themeColors[theme] || themeColors.trade;

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-medium hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
        onClick={() => showDetails && setIsModalOpen(true)}
      >
        {/* Image */}
        <div className="relative h-48 md:h-56 lg:h-64 bg-gray-200 overflow-hidden">
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

          {/* View Details badge on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <span className="px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold shadow-lg flex items-center gap-2">
              <span>View Details</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
          {/* Category Badge */}
          {service.category && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase border border-gray-200">
                {service.category.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-trade-primary transition-colors">
            {service.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Price */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <span
              className={clsx("text-xl md:text-2xl font-bold", colors.primary)}
            >
              {formatPrice()}
            </span>
          </div>

          {/* CTA Button */}
          <BookingButton
            service={service}
            theme={theme}
            size="md"
            className="w-full"
          />
        </div>
      </div>

      {/* Service Detail Modal */}
      {showDetails && (
        <ServiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={service}
          theme={theme}
        />
      )}
    </>
  );
}
