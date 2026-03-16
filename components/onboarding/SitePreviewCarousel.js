"use client";

import { useState, useRef } from "react";
import SiteRenderer from "../sites/SiteRenderer.js";

/**
 * SitePreviewCarousel Component
 *
 * Shows 3 AI-generated site previews in a horizontal swiper.
 * User swipes to browse and taps "I want this one" to select.
 *
 * @param {Object} props
 * @param {Object[]} props.variations - Array of 3 SiteConfig objects
 * @param {Function} props.onSelect - Called with selected index + SiteConfig
 * @param {boolean} [props.disabled] - Disable selection
 */
export default function SitePreviewCarousel({
  variations = [],
  onSelect,
  disabled = false,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIndex = Math.round(scrollLeft / clientWidth);
    if (
      newIndex !== activeIndex &&
      newIndex >= 0 &&
      newIndex < variations.length
    ) {
      setActiveIndex(newIndex);
    }
  };

  const scrollTo = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  if (variations.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800">
          Here are 3 designs for your site ✨
        </h3>
        <p className="text-sm text-gray-500">Swipe to browse • Tap to select</p>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {variations.map((config, index) => (
          <div
            key={index}
            className="flex-none w-full snap-center px-4"
            style={{ scrollSnapAlign: "center" }}
          >
            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
              {/* Preview container — scale down the full site */}
              <div
                className="relative bg-white overflow-hidden"
                style={{
                  height: "400px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(0.35)",
                    transformOrigin: "top left",
                    width: "286%",
                    height: "286%",
                    pointerEvents: "none",
                  }}
                >
                  <SiteRenderer site={{ ...config, id: `preview-${index}` }} />
                </div>
              </div>

              {/* Variation label */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Design {index + 1} of {variations.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(index, config)}
                    disabled={disabled}
                    className="px-6 py-2. rounded-lg font-semibold text-white text-sm transition-all bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    I want this one →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2">
        {variations.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === activeIndex
                ? "bg-blue-600 scale-125"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to design ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
