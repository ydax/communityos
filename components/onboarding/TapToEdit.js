"use client";

import { useState } from "react";

/**
 * TapToEdit Component
 *
 * Mobile bottom-sheet modal for inline text editing.
 * Opens when user taps editable text in the site preview.
 * Supports manual editing and AI-powered rewrites.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the editor is visible
 * @param {Function} props.onClose - Callback to close the editor
 * @param {string} props.fieldName - Name of the field being edited (e.g. 'headline')
 * @param {string} props.currentValue - Current text value
 * @param {Function} props.onSave - Called with new text value
 * @param {string} [props.sectionType] - Section type for context (e.g. 'hero')
 */
export default function TapToEdit({
  isOpen,
  onClose,
  fieldName,
  currentValue,
  onSave,
  sectionType = "",
}) {
  const [editValue, setEditValue] = useState(currentValue);
  const [isRewriting, setIsRewriting] = useState(false);

  // Reset value when opening with new content
  if (isOpen && editValue !== currentValue && !isRewriting) {
    setEditValue(currentValue);
  }

  const handleSave = () => {
    onSave(editValue);
    onClose();
  };

  const handleAiRewrite = async (tone) => {
    setIsRewriting(true);
    try {
      // Call AI to rewrite the text
      const response = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editValue,
          tone,
          fieldType: fieldName,
          sectionType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rewritten) {
          setEditValue(data.rewritten);
        }
      }
    } catch (err) {
      console.warn("[TapToEdit] AI rewrite failed:", err);
    } finally {
      setIsRewriting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Edit {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
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

          {/* Text input */}
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
            rows={fieldName === "bio" ? 6 : 3}
            disabled={isRewriting}
          />

          {/* AI rewrite buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-400 self-center mr-1">AI:</span>
            {[
              { label: "More Professional", tone: "professional" },
              { label: "More Friendly", tone: "friendly" },
              { label: "More Punchy", tone: "punchy" },
              { label: "Shorter", tone: "shorter" },
            ].map(({ label, tone }) => (
              <button
                key={tone}
                type="button"
                onClick={() => handleAiRewrite(tone)}
                disabled={isRewriting}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {isRewriting ? "..." : `✨ ${label}`}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
