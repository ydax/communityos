import { useState, useEffect } from "react";
import clsx from "clsx";

/**
 * ListingDialog Component
 * Modal dialog for creating/editing listings
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.listing - Existing listing data (for editing)
 * @param {string} props.siteId - Current site ID
 */
export default function ListingDialog({
  isOpen,
  onClose,
  onSave,
  listing = null,
  siteId,
}) {
  const isEditing = listing !== null;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "service",
    category: "",
    pricing: {
      model: "hourly",
      basePrice: "",
      unit: "hour",
    },
    images: [],
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with listing data when editing
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || "",
        description: listing.description || "",
        type: listing.type || "service",
        category: listing.category || "",
        pricing: listing.pricing || {
          model: "hourly",
          basePrice: "",
          unit: "hour",
        },
        images: listing.images || [],
        status: listing.status || "active",
      });
    }
  }, [listing]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        type: "service",
        category: "",
        pricing: {
          model: "hourly",
          basePrice: "",
          unit: "hour",
        },
        images: [],
        status: "active",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePricingChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      pricing: { ...prev.pricing, [field]: value },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (
      formData.type === "service" &&
      formData.pricing.model !== "quote_required"
    ) {
      if (
        !formData.pricing.basePrice ||
        parseFloat(formData.pricing.basePrice) <= 0
      ) {
        newErrors.basePrice = "Base price must be greater than 0";
      }
    }

    if (
      formData.type === "good" &&
      (!formData.pricing.basePrice ||
        parseFloat(formData.pricing.basePrice) <= 0)
    ) {
      newErrors.basePrice = "Base price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const listingData = {
        ...formData,
        siteId,
        pricing: {
          ...formData.pricing,
          basePrice: formData.pricing.basePrice
            ? parseFloat(formData.pricing.basePrice)
            : null,
        },
      };

      await onSave(listingData);
      onClose();
    } catch (error) {
      console.error("Error saving listing:", error);
      setErrors({ submit: "Failed to save listing. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? "Edit Listing" : "Create New Listing"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={clsx(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                errors.title ? "border-red-500" : "border-gray-300",
              )}
              placeholder="e.g., Fence Repair Service"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className={clsx(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                errors.description ? "border-red-500" : "border-gray-300",
              )}
              placeholder="Detailed description of the listing..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Type */}
          <div className="mb-4">
            <label
              htmlFor="type"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
            >
              <option value="service">Service</option>
              <option value="good">Good</option>
            </select>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label
              htmlFor="category"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Category *
            </label>
            <input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              className={clsx(
                "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                errors.category ? "border-red-500" : "border-gray-300",
              )}
              placeholder="e.g., fence_repair, landscaping"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Pricing Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Pricing</h3>

            {formData.type === "service" && (
              <>
                {/* Pricing Model */}
                <div className="mb-4">
                  <label
                    htmlFor="pricingModel"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Pricing Model
                  </label>
                  <select
                    id="pricingModel"
                    value={formData.pricing.model}
                    onChange={(e) =>
                      handlePricingChange("model", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                  >
                    <option value="hourly">Hourly Rate</option>
                    <option value="flat_rate">Flat Rate</option>
                    <option value="quote_required">Quote Required</option>
                  </select>
                </div>

                {formData.pricing.model !== "quote_required" && (
                  <>
                    {/* Base Price */}
                    <div className="mb-4">
                      <label
                        htmlFor="basePrice"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Base Price *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-200 text-gray-700">
                          $
                        </span>
                        <input
                          id="basePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pricing.basePrice}
                          onChange={(e) =>
                            handlePricingChange("basePrice", e.target.value)
                          }
                          className={clsx(
                            "flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                            errors.basePrice
                              ? "border-red-500"
                              : "border-gray-300",
                          )}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.basePrice && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.basePrice}
                        </p>
                      )}
                    </div>

                    {/* Unit */}
                    <div className="mb-4">
                      <label
                        htmlFor="unit"
                        className="block text-sm font-semibold text-gray-700 mb-2"
                      >
                        Unit
                      </label>
                      <select
                        id="unit"
                        value={formData.pricing.unit}
                        onChange={(e) =>
                          handlePricingChange("unit", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
                      >
                        <option value="hour">Hour</option>
                        <option value="project">Project</option>
                        <option value="square_foot">Square Foot</option>
                        <option value="linear_foot">Linear Foot</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}

            {formData.type === "good" && (
              <div className="mb-4">
                <label
                  htmlFor="basePrice"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Base Price * (Starting price before variants)
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-200 text-gray-700">
                    $
                  </span>
                  <input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricing.basePrice}
                    onChange={(e) =>
                      handlePricingChange("basePrice", e.target.value)
                    }
                    className={clsx(
                      "flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent",
                      errors.basePrice ? "border-red-500" : "border-gray-300",
                    )}
                    placeholder="0.00"
                  />
                </div>
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.basePrice}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  You can add variants with specific prices after creating the
                  listing.
                </p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trade-primary focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-trade-primary text-white rounded-lg font-semibold hover:bg-trade-dark transition-colors disabled:opacity-50"
            >
              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Update Listing"
                  : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
