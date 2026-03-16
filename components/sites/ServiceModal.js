"use client";

import { useState } from "react";
import clsx from "clsx";

/**
 * ServiceModal Component
 * Modal displaying full service details
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.service - Service data
 * @param {string} props.theme - Site theme ('maker', 'trade', 'venue')
 */
export default function ServiceModal({
  isOpen,
  onClose,
  service,
  theme = "trade",
}) {
  if (!isOpen || !service) return null;

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

  const formatSchedule = () => {
    if (!service.availability?.schedule) return null;

    const { days, hours } = service.availability.schedule;
    if (!days || !hours) return null;

    const dayNames = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };

    const formattedDays = days.map((d) => dayNames[d] || d).join(", ");

    return `${formattedDays} • ${hours.start} - ${hours.end}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Gallery */}
        {service.images && service.images.length > 0 && (
          <div className="relative h-64 md:h-96 bg-gray-200">
            <img
              src={service.images[0]}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 shadow-lg transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {service.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={clsx(
                  "text-xl md:text-2xl font-bold",
                  theme === "maker" && "text-maker-primary",
                  theme === "trade" && "text-trade-primary",
                  theme === "venue" && "text-venue-primary",
                )}
              >
                {formatPrice()}
              </span>
              {service.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                  {service.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </div>

          {/* Availability */}
          {service.availability?.schedule && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Availability
              </h3>
              <p className="text-gray-600">{formatSchedule()}</p>
            </div>
          )}

          {/* Pricing Details (for non-quote services) */}
          {service.pricing?.model !== "quote_required" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Pricing Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Rate:</span>
                  <span className="font-semibold text-gray-800">
                    ${service.pricing.basePrice.toFixed(2)}
                  </span>
                </div>
                {service.pricing.minCharge && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Charge:</span>
                    <span className="font-semibold text-gray-800">
                      {service.pricing.minCharge} {service.pricing.unit}(s)
                    </span>
                  </div>
                )}
                {service.pricing.maxPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Price:</span>
                    <span className="font-semibold text-gray-800">
                      ${service.pricing.maxPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className={clsx(
                "flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-medium hover:shadow-strong",
                theme === "maker" && "bg-maker-primary hover:opacity-90",
                theme === "trade" && "bg-trade-primary hover:bg-trade-dark",
                theme === "venue" && "bg-venue-primary hover:opacity-90",
              )}
            >
              {service.pricing?.model === "quote_required"
                ? "Request Quote"
                : "Book Now"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
