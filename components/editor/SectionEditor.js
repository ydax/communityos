import { useState } from "react";

/**
 * SectionEditor Component
 * Form-based editor for individual section properties
 *
 * @param {Object} props - Component props
 * @param {Object} props.section - Section data
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onCancel - Cancel handler
 */
export default function SectionEditor({ section, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    visible: section.visible !== undefined ? section.visible : true,
    data: section.data || {},
  });

  const handleDataChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...section,
      ...formData,
    });
  };

  // Render different fields based on section type
  const renderFields = () => {
    switch (section.type) {
      case "hero":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Headline
              </label>
              <input
                type="text"
                value={formData.data.headline || ""}
                onChange={(e) => handleDataChange("headline", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="e.g., Expert Fence Solutions"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subheadline
              </label>
              <input
                type="text"
                value={formData.data.subheadline || ""}
                onChange={(e) =>
                  handleDataChange("subheadline", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="e.g., Serving Kyle, TX"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CTA Button Text
              </label>
              <input
                type="text"
                value={formData.data.ctaText || ""}
                onChange={(e) => handleDataChange("ctaText", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="e.g., Get a Quote"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                CTA Button Link
              </label>
              <input
                type="text"
                value={formData.data.ctaLink || ""}
                onChange={(e) => handleDataChange("ctaLink", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="/contact"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Background Image URL
              </label>
              <input
                type="text"
                value={formData.data.image || ""}
                onChange={(e) => handleDataChange("image", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="gs://..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload images using the image upload utility
              </p>
            </div>
          </>
        );

      case "about":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                About Us Text
              </label>
              <textarea
                value={formData.data.bio || ""}
                onChange={(e) => handleDataChange("bio", e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="Tell your story..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={formData.data.image || ""}
                onChange={(e) => handleDataChange("image", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="gs://..."
              />
            </div>
          </>
        );

      case "contact":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.data.phone || ""}
                onChange={(e) => handleDataChange("phone", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="(512) 555-1234"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.data.email || ""}
                onChange={(e) => handleDataChange("email", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="contact@example.com"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.data.address || ""}
                onChange={(e) => handleDataChange("address", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                placeholder="123 Main St, Kyle, TX 78640"
              />
            </div>
          </>
        );

      case "services":
        return (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Services section automatically displays all active services from
              your Item Library. No configuration needed.
            </p>
          </div>
        );

      case "gallery":
        return (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image URLs (one per line)
            </label>
            <textarea
              value={(formData.data.images || []).join("\n")}
              onChange={(e) =>
                handleDataChange(
                  "images",
                  e.target.value.split("\n").filter((url) => url.trim()),
                )
              }
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
              placeholder="gs://path/to/image1.jpg&#10;gs://path/to/image2.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload images using the image upload utility
            </p>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              No editable fields for this section type.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 w-full h-full overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Edit {section.type.charAt(0).toUpperCase() + section.type.slice(1)}{" "}
            Section
          </h3>
        </div>

        {/* Visibility Toggle */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.visible}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, visible: e.target.checked }))
              }
              className="w-5 h-5 text-trade-primary rounded focus:ring-2 focus:ring-trade-primary"
            />
            <span className="ml-3 text-sm font-semibold text-gray-700">
              Show this section on the site
            </span>
          </label>
        </div>

        {/* Section-specific fields */}
        {renderFields()}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
