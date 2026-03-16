"use client";

import { getAllVibePresets } from "../../lib/config/vibePresets.js";

/**
 * VibeSelector Component
 *
 * Visual grid of vibe presets for the user to tap and select
 * their aesthetic preference. Shows color swatches, emoji,
 * label, and description for each vibe.
 *
 * @param {Object} props
 * @param {string|null} props.selected - Currently selected vibe ID
 * @param {Function} props.onSelect - Called with vibe ID when tapped
 * @param {boolean} [props.disabled] - Disable selection
 */
export default function VibeSelector({ selected, onSelect, disabled = false }) {
  const presets = getAllVibePresets();

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {presets.map((vibe) => {
        const isSelected = selected === vibe.id;
        return (
          <button
            key={vibe.id}
            type="button"
            onClick={() => onSelect(vibe.id)}
            disabled={disabled}
            className={`relative p-4 rounded-xl border-2 transition-all text-left group ${
              isSelected
                ? "border-blue-600 shadow-lg scale-[1.02] bg-blue-50"
                : "border-gray-200 hover:border-gray-400 hover:shadow-md bg-white"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}

            {/* Emoji + Color swatches */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{vibe.emoji}</span>
              <div className="flex gap-1">
                <div
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: vibe.colors.primary }}
                  title={`Primary: ${vibe.colors.primary}`}
                />
                <div
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: vibe.colors.accent }}
                  title={`Accent: ${vibe.colors.accent}`}
                />
              </div>
            </div>

            {/* Label */}
            <div
              className={`font-semibold text-sm mb-1 ${isSelected ? "text-blue-700" : "text-gray-800"}`}
            >
              {vibe.label}
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500 leading-snug">
              {vibe.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
